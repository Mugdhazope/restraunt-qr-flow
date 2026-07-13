"""Menu item image processing: optional background removal + square WebP artboard."""
from __future__ import annotations

import logging
from io import BytesIO
from typing import TYPE_CHECKING

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image
from PIL import ImageOps

if TYPE_CHECKING:
    from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)

MENU_ARTBOARD_PX = 512
WEBP_QUALITY = 80
WEBP_METHOD = 6


def _rgba_from_raw(raw: bytes) -> bytes:
    """Ensure PNG bytes in RGBA (no background removal); strip EXIF."""
    im = ImageOps.exif_transpose(Image.open(BytesIO(raw))).convert("RGBA")
    buf = BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def _remove_via_sidecar(raw: bytes) -> bytes:
    base = getattr(settings, "MENU_BG_REMOVAL_URL", "").strip().rstrip("/")
    if not base:
        msg = "MENU_BG_REMOVAL_URL is not configured"
        raise RuntimeError(msg)
    url = f"{base}/remove"
    resp = requests.post(
        url,
        files={"file": ("upload.bin", raw)},
        timeout=180,
    )
    resp.raise_for_status()
    return resp.content


def _remove_via_remove_bg(raw: bytes) -> bytes:
    key = getattr(settings, "REMOVEBG_API_KEY", "").strip()
    if not key:
        msg = "REMOVEBG_API_KEY is not configured"
        raise RuntimeError(msg)
    resp = requests.post(
        "https://api.remove.bg/v1.0/removebg",
        files={"image_file": ("upload.bin", raw)},
        data={"size": "auto", "format": "png"},
        headers={"X-Api-Key": key},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.content


def fetch_background_removed_png(raw: bytes) -> bytes:
    """Return PNG bytes (ideally RGBA cutout). Falls back to RGBA passthrough."""
    if getattr(settings, "MENU_BG_REMOVAL_URL", "").strip():
        try:
            return _remove_via_sidecar(raw)
        except requests.RequestException as exc:
            logger.warning("Sidecar background removal failed: %s", exc)
    if getattr(settings, "REMOVEBG_API_KEY", "").strip():
        try:
            return _remove_via_remove_bg(raw)
        except requests.RequestException as exc:
            logger.warning("remove.bg failed: %s", exc)
    return _rgba_from_raw(raw)


def pad_to_square_webp(rgba_png_bytes: bytes, size: int = MENU_ARTBOARD_PX) -> bytes:
    """Letterbox/pad onto a transparent square and encode lossy WebP (alpha OK)."""
    im = ImageOps.exif_transpose(Image.open(BytesIO(rgba_png_bytes))).convert("RGBA")
    # Drop residual EXIF / ICC before encode.
    im.info.clear()
    im.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - im.width) // 2
    y = (size - im.height) // 2
    canvas.paste(im, (x, y), im)
    out = BytesIO()
    canvas.save(
        out,
        format="WEBP",
        quality=WEBP_QUALITY,
        method=WEBP_METHOD,
    )
    return out.getvalue()


# Back-compat alias for callers/tests that still import the old name.
def pad_to_square_png(rgba_png_bytes: bytes, size: int = MENU_ARTBOARD_PX) -> bytes:
    return pad_to_square_webp(rgba_png_bytes, size=size)


def process_menu_upload(raw: bytes) -> ContentFile:
    """Full pipeline: matting (if configured) + square WebP artboard."""
    cutout = fetch_background_removed_png(raw)
    final_webp = pad_to_square_webp(cutout)
    return ContentFile(final_webp, name="item.webp")


def process_uploaded_menu_image(uploaded: UploadedFile) -> ContentFile:
    raw = uploaded.read()
    return process_menu_upload(raw)

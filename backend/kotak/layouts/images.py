"""Process layout background image uploads (resize + JPEG, no cutout)."""
from __future__ import annotations

from io import BytesIO
from typing import TYPE_CHECKING

from django.core.files.base import ContentFile
from PIL import Image
from PIL import ImageOps

if TYPE_CHECKING:
    from django.core.files.uploadedfile import UploadedFile

MAX_EDGE_PX = 2048
JPEG_QUALITY = 85


def process_layout_background_upload(raw: bytes) -> ContentFile:
    """EXIF-correct, downscale long edge, save as JPEG."""
    im = ImageOps.exif_transpose(Image.open(BytesIO(raw)))
    if im.mode in ("RGBA", "LA", "P"):
        rgba = im.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[-1] if rgba.mode == "RGBA" else None)
        im = bg
    else:
        im = im.convert("RGB")

    im.thumbnail((MAX_EDGE_PX, MAX_EDGE_PX), Image.Resampling.LANCZOS)
    out = BytesIO()
    im.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return ContentFile(out.getvalue(), name="background.jpg")


def process_uploaded_layout_image(uploaded: UploadedFile) -> ContentFile:
    return process_layout_background_upload(uploaded.read())

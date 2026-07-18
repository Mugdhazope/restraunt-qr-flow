"""Upload path helpers for layout background assets."""
from __future__ import annotations

import uuid


def layout_asset_upload_to(instance, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    if ext not in {"jpg", "jpeg", "png", "gif", "webp"}:
        ext = "jpg"
    slug = getattr(getattr(instance, "restaurant", None), "slug", "unknown") or "unknown"
    return f"layouts/{slug}/{uuid.uuid4().hex}.{ext}"

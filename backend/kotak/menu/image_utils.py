"""Upload path helpers for menu migrations and models."""
from __future__ import annotations

import uuid


def menu_item_image_upload_to(instance, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    if ext not in {"jpg", "jpeg", "png", "gif", "webp", "bin"}:
        ext = "bin"
    return f"menu/items/{uuid.uuid4().hex}.{ext}"

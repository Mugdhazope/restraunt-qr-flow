"""Staff bulk menu image + metadata import."""
from __future__ import annotations

import json
import uuid
from typing import Any

from kotak.menu.images import process_menu_upload
from kotak.menu.models import MenuCategory
from kotak.menu.models import MenuItem
from kotak.menu.serializers import MenuBulkRowSerializer
from kotak.restaurants.models import Restaurant  # noqa: TC001


def parse_bulk_manifest(manifest_raw: Any) -> list:
    if isinstance(manifest_raw, list):
        return manifest_raw
    if isinstance(manifest_raw, str):
        return json.loads(manifest_raw)
    msg = "manifest must be a JSON array or string"
    raise TypeError(msg)


def run_menu_bulk_upload(
    restaurant: Restaurant,
    rows: list,
    image_files: list,
) -> list[dict]:
    """Create/update menu items with processed images; returns result dicts."""
    if len(rows) != len(image_files):
        msg = f"Expected {len(rows)} image(s), got {len(image_files)}."
        raise ValueError(msg)
    results: list[dict] = []
    for idx, row in enumerate(rows):
        ser = MenuBulkRowSerializer(data=row)
        if not ser.is_valid():
            results.append({"index": idx, "ok": False, "errors": ser.errors})
            continue
        data = ser.validated_data
        cat = MenuCategory.objects.filter(
            restaurant=restaurant,
            name=data["category_name"].strip(),
        ).first()
        if not cat:
            err = {"category_name": ["Unknown category for this restaurant."]}
            results.append({"index": idx, "ok": False, "errors": err})
            continue
        defaults = {
            "description": data.get("description") or "",
            "price": data["price"],
            "tag": data.get("tag") or "",
            "is_featured": data.get("is_featured", False),
            "is_new": data.get("is_new", False),
            "is_jain": data.get("is_jain", False),
        }
        upload = image_files[idx]
        raw = upload.read()
        try:
            cf = process_menu_upload(raw)
        except (OSError, ValueError, RuntimeError) as exc:
            results.append({"index": idx, "ok": False, "errors": {"image": [str(exc)]}})
            continue
        item, _created = MenuItem.objects.update_or_create(
            category=cat,
            name=data["name"].strip(),
            defaults=defaults,
        )
        if item.image:
            item.image.delete(save=False)
        item.image.save(f"{uuid.uuid4().hex}.png", cf, save=False)
        item.save()
        results.append({"index": idx, "ok": True, "id": item.id})
    return results

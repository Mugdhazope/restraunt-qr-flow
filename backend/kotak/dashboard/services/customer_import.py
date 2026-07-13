# ruff: noqa: TC001, E501
from __future__ import annotations

from typing import Any

from kotak.accounts.api.serializers import E164_PHONE_REGEX
from kotak.customers.models import Customer
from kotak.customers.models import CustomerTag
from kotak.restaurants.models import Restaurant


def import_customers(restaurant: Restaurant, rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Upsert customers by (restaurant, phone). Phones must be E.164."""
    created = 0
    updated = 0
    errors: list[dict[str, Any]] = []
    valid_tags = {c.value for c in CustomerTag}

    for i, row in enumerate(rows):
        phone = str(row.get("phone", "")).strip()
        name = str(row.get("name", "")).strip()
        if not E164_PHONE_REGEX.match(phone):
            errors.append({"row": i, "phone": phone, "error": "Phone must be E.164, e.g. +919999999999."})
            continue
        tag_raw = str(row.get("tag", "") or "").strip().lower()
        if tag_raw == "regular":
            tag_raw = CustomerTag.NEUTRAL.value
        tag = tag_raw if tag_raw in valid_tags else CustomerTag.NEUTRAL.value
        display_name = name or phone
        _obj, was_created = Customer.objects.update_or_create(
            restaurant=restaurant,
            phone=phone,
            defaults={
                "name": display_name,
                "tag": tag,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1

    return {"created": created, "updated": updated, "errors": errors}

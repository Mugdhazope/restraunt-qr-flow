from __future__ import annotations

from django.db.models import F

from kotak.layouts.defaults import SCHEMA_VERSION
from kotak.layouts.defaults import default_layout_for
from kotak.layouts.models import PageKey
from kotak.layouts.models import PageLayout
from kotak.restaurants.models import Restaurant


def ensure_default_layouts(restaurant: Restaurant) -> list[PageLayout]:
    """Create missing default layouts for a restaurant. Idempotent.

    Also upgrades pristine schema_version < 2 rows (version==1) to freeform defaults
    so MenuBook / frames ship without wiping customized saves (version > 1).
    """
    created: list[PageLayout] = []
    for page_key, _label in PageKey.choices:
        obj, was_created = PageLayout.objects.get_or_create(
            restaurant=restaurant,
            page_key=page_key,
            defaults={
                "schema_version": SCHEMA_VERSION,
                "version": 1,
                "layout": default_layout_for(page_key),
            },
        )
        if was_created:
            created.append(obj)
        elif obj.schema_version < SCHEMA_VERSION and obj.version == 1:
            layout = default_layout_for(page_key)
            obj.layout = layout
            obj.schema_version = SCHEMA_VERSION
            obj.save(update_fields=["layout", "schema_version", "updated_at"])
    return created


def ensure_defaults_for_all_restaurants() -> int:
    total = 0
    for restaurant in Restaurant.objects.all().iterator():
        total += len(ensure_default_layouts(restaurant))
    return total


def get_or_default_layout(restaurant: Restaurant, page_key: str) -> PageLayout:
    ensure_default_layouts(restaurant)
    return PageLayout.objects.get(restaurant=restaurant, page_key=page_key)


def reset_layout_to_default(
    restaurant: Restaurant,
    page_key: str,
    *,
    user=None,
) -> PageLayout:
    layout = default_layout_for(page_key)
    updated_by = user if getattr(user, "is_authenticated", False) else None
    schema_version = layout.get("schema_version", SCHEMA_VERSION)
    obj, created = PageLayout.objects.get_or_create(
        restaurant=restaurant,
        page_key=page_key,
        defaults={
            "layout": layout,
            "schema_version": schema_version,
            "version": 1,
            "updated_by": updated_by,
        },
    )
    if not created:
        obj.layout = layout
        obj.schema_version = schema_version
        obj.updated_by = updated_by
        obj.version = F("version") + 1
        obj.save(update_fields=["layout", "schema_version", "updated_by", "version", "updated_at"])
        obj.refresh_from_db()
    return obj

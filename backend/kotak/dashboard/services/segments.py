from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING

from django.conf import settings
from django.db.models import Q
from django.utils import timezone

from kotak.customers.models import Customer
from kotak.customers.models import CustomerTag

if TYPE_CHECKING:
    from kotak.restaurants.models import Restaurant


class CampaignTargetType:
    ALL = "ALL"
    VIP = "VIP"
    FREQUENT = "FREQUENT"
    INACTIVE = "INACTIVE"
    FIRST_TIME = "FIRST_TIME"
    NEUTRAL = "NEUTRAL"
    INACTIVE_TAG = "INACTIVE_TAG"


def customers_for_target(restaurant: Restaurant, target_type: str):
    """Return customers for a campaign segment (queryset, not evaluated)."""
    base = Customer.objects.filter(restaurant=restaurant)
    if target_type == CampaignTargetType.ALL:
        return base
    if target_type == CampaignTargetType.INACTIVE:
        days = getattr(settings, "CRM_INACTIVE_VISIT_DAYS", 90)
        cutoff = timezone.now() - timedelta(days=days)
        return base.filter(Q(last_visit__lt=cutoff) | Q(last_visit__isnull=True))
    tag_by_target = {
        CampaignTargetType.VIP: CustomerTag.VIP,
        CampaignTargetType.FREQUENT: CustomerTag.FREQUENT,
        CampaignTargetType.FIRST_TIME: CustomerTag.FIRST_TIME,
        CampaignTargetType.NEUTRAL: CustomerTag.NEUTRAL,
        CampaignTargetType.INACTIVE_TAG: CustomerTag.INACTIVE,
    }
    tag = tag_by_target.get(target_type)
    if tag is not None:
        return base.filter(tag=tag)
    return base.none()

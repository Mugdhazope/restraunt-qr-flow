from __future__ import annotations

import logging
from typing import Any

from celery import shared_task
from django.utils import timezone

from kotak.campaigns.models import CampaignSend
from kotak.campaigns.services import sync_campaign_rollup
from kotak.campaigns.services import upsert_recipient_events
from kotak.customers.models import Customer
from kotak.dashboard.services.whatsapp_dispatch import send_campaign_messages
from kotak.restaurants.models import Restaurant

logger = logging.getLogger(__name__)


@shared_task
def send_campaign_whatsapp_task(
    campaign_send_id: int,
    restaurant_id: int,
    customer_ids: list[int],
) -> dict[str, Any]:
    row = CampaignSend.objects.get(pk=campaign_send_id, restaurant_id=restaurant_id)
    row.status = CampaignSend.DeliveryStatus.PROCESSING
    row.started_at = timezone.now()
    row.save(update_fields=["status", "started_at"])
    restaurant = Restaurant.objects.get(pk=restaurant_id)
    qs = Customer.objects.filter(
        restaurant_id=restaurant_id,
        pk__in=customer_ids,
    ).order_by("name")
    result = send_campaign_messages(restaurant, qs, row.message)
    row.sent = result["sent"]
    row.failed = result["failed"]
    row.recipient_count = result["recipient_count"]
    row.status = CampaignSend.DeliveryStatus.SENT if result["failed"] == 0 else CampaignSend.DeliveryStatus.PARTIAL
    row.completed_at = timezone.now()
    row.save(update_fields=["sent", "failed", "recipient_count", "status", "completed_at"])
    upsert_recipient_events(row, result.get("recipient_events", []))
    sync_campaign_rollup(row)
    logger.info(
        "campaign_whatsapp_task_done",
        extra={
            "restaurant_id": restaurant_id,
            "campaign_send_id": row.id,
            "sent": result["sent"],
            "failed": result["failed"],
        },
    )
    return {
        "id": row.id,
        "name": row.name,
        "target_type": row.target_type,
        **result,
    }

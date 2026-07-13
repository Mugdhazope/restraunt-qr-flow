# ruff: noqa: TC001
from __future__ import annotations

from django.db.models import Count
from django.db.models import Q
from django.utils import timezone

from kotak.campaigns.models import CampaignRecipientEvent
from kotak.campaigns.models import CampaignSend
from kotak.restaurants.models import Restaurant


def record_campaign_send(  # noqa: PLR0913
    restaurant: Restaurant,
    *,
    name: str,
    target_type: str,
    message: str,
    recipient_count: int,
    sent: int,
    failed: int,
) -> CampaignSend:
    return CampaignSend.objects.create(
        restaurant=restaurant,
        name=name,
        target_type=target_type,
        message=message,
        recipient_count=recipient_count,
        sent=sent,
        failed=failed,
    )


def sync_campaign_rollup(campaign_send: CampaignSend) -> CampaignSend:
    counts = campaign_send.recipient_events.aggregate(
        delivered=Count("id", filter=Q(status="delivered")),
        opened=Count("id", filter=Q(status="read")),
        responses=Count("id", filter=Q(reply_count__gt=0)),
        failed=Count("id", filter=Q(status="failed")),
        sent=Count("id", filter=Q(status__in=["sent", "delivered", "read", "replied"])),
    )
    campaign_send.delivered = int(counts["delivered"] or 0)
    campaign_send.opened = int(counts["opened"] or 0)
    campaign_send.responses = int(counts["responses"] or 0)
    campaign_send.failed = int(counts["failed"] or 0)
    campaign_send.sent = int(counts["sent"] or 0)
    if campaign_send.recipient_count and campaign_send.sent + campaign_send.failed >= campaign_send.recipient_count:
        campaign_send.completed_at = campaign_send.completed_at or timezone.now()
        if campaign_send.failed > 0 and campaign_send.sent > 0:
            campaign_send.status = CampaignSend.DeliveryStatus.PARTIAL
        elif campaign_send.failed > 0:
            campaign_send.status = CampaignSend.DeliveryStatus.FAILED
        else:
            campaign_send.status = CampaignSend.DeliveryStatus.SENT
    campaign_send.save(
        update_fields=[
            "delivered",
            "opened",
            "responses",
            "failed",
            "sent",
            "status",
            "completed_at",
        ],
    )
    return campaign_send


def upsert_recipient_events(campaign_send: CampaignSend, recipient_events: list[dict]) -> None:
    rows: list[CampaignRecipientEvent] = []
    now = timezone.now()
    for item in recipient_events:
        status = str(item.get("status") or "pending")
        rows.append(
            CampaignRecipientEvent(
                campaign_send=campaign_send,
                customer_id=item.get("customer_id"),
                phone=str(item.get("phone") or ""),
                wamid=str(item.get("wamid") or ""),
                status=status,
                sent_at=now if status == "sent" else None,
                failed_at=now if status == "failed" else None,
                failure_details=str(item.get("error") or ""),
                meta_error_code=item.get("meta_error_code"),
            ),
        )
    if rows:
        CampaignRecipientEvent.objects.bulk_create(rows)

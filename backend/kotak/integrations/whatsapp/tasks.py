from __future__ import annotations

import logging

from celery import shared_task

from kotak.customers.models import Visit
from kotak.integrations.whatsapp.exceptions import WhatsAppError
from kotak.integrations.whatsapp.services import WhatsAppService

logger = logging.getLogger(__name__)


@shared_task
def send_feedback_message(visit_id: int) -> None:
    try:
        visit = Visit.objects.select_related("customer", "restaurant").get(id=visit_id)
    except Visit.DoesNotExist:
        logger.warning(
            "visit_not_found_for_feedback_task",
            extra={"visit_id": visit_id},
        )
        return

    logger.info(
        "send_feedback_message_started",
        extra={
            "visit_id": visit_id,
            "customer_id": visit.customer_id,
            "restaurant_id": visit.restaurant_id,
        },
    )
    try:
        WhatsAppService().send_text(
            phone=visit.customer.phone,
            message=(
                "Hey! How was your experience?\n"
                "Reply with a rating (1–5) ⭐"
            ),
        )
    except WhatsAppError:
        logger.exception(
            "send_feedback_message_whatsapp_failed",
            extra={"visit_id": visit_id, "phone": visit.customer.phone},
        )

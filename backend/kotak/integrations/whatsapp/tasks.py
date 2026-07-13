from __future__ import annotations

import logging

from celery import shared_task

from kotak.customers.models import Visit
from kotak.dashboard.services.whatsapp_dispatch import whatsapp_client_for_restaurant
from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError
from kotak.integrations.whatsapp.exceptions import WhatsAppError
from kotak.integrations.whatsapp.services import WhatsAppService

logger = logging.getLogger(__name__)
_META_OUTSIDE_24H_SESSION = 131047
_META_TEMPLATE_TRANSLATION_MISSING = 132001


def _template_language_candidates(language_code: str) -> list[str]:
    base = (language_code or "").strip() or "en"
    ordered: list[str] = []

    def add(code: str) -> None:
        c = (code or "").strip()
        if c and c not in ordered:
            ordered.append(c)

    if "_" in base:
        add(base.split("_", 1)[0])
    if "-" in base:
        add(base.split("-", 1)[0])
    add(base)
    add("en")
    add("en_US")
    return ordered


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
    restaurant = visit.restaurant
    name = restaurant.name.strip() or "us"
    feedback_template_name = (restaurant.whatsapp_feedback_template_name or "").strip()
    feedback_template_lang = (restaurant.whatsapp_feedback_template_language or "en").strip() or "en"
    service = WhatsAppService(client=whatsapp_client_for_restaurant(restaurant))
    feedback_text = (
        f"Hey! How was your experience at {name}?\n"
        "Reply with a rating (1-5) ⭐"
    )
    feedback_template_param = f"your experience at {name}"

    def send_feedback_template(phone: str) -> bool:
        if not feedback_template_name:
            return False
        langs = _template_language_candidates(feedback_template_lang)
        for idx, lang in enumerate(langs):
            try:
                service.send_template(
                    phone=phone,
                    template_name=feedback_template_name,
                    language_code=lang,
                    body_parameters=[feedback_template_param],
                )
                logger.info(
                    "send_feedback_message_template_sent",
                    extra={
                        "visit_id": visit_id,
                        "customer_id": visit.customer_id,
                        "restaurant_id": visit.restaurant_id,
                        "template_name": feedback_template_name,
                        "template_language": lang,
                        "language_fallback_used": idx > 0,
                    },
                )
                return True
            except WhatsAppAPIError as exc:
                can_retry_lang = (
                    exc.meta_code == _META_TEMPLATE_TRANSLATION_MISSING
                    and idx < len(langs) - 1
                )
                if can_retry_lang:
                    logger.warning(
                        "send_feedback_message_template_language_retry",
                        extra={
                            "visit_id": visit_id,
                            "template_name": feedback_template_name,
                            "attempt_language": lang,
                            "next_language": langs[idx + 1],
                        },
                    )
                    continue
                raise
        return False

    try:
        service.send_text(phone=visit.customer.phone, message=feedback_text)
    except WhatsAppAPIError as exc:
        if exc.meta_code == _META_OUTSIDE_24H_SESSION and feedback_template_name:
            logger.info(
                "send_feedback_message_retrying_template_after_24h_block",
                extra={"visit_id": visit_id, "phone": visit.customer.phone},
            )
            try:
                if send_feedback_template(visit.customer.phone):
                    return
            except WhatsAppError:
                logger.exception(
                    "send_feedback_message_template_retry_failed",
                    extra={"visit_id": visit_id, "phone": visit.customer.phone},
                )
        if exc.meta_code == _META_OUTSIDE_24H_SESSION and not feedback_template_name:
            logger.warning(
                "send_feedback_message_missing_template_for_24h_window",
                extra={
                    "visit_id": visit_id,
                    "restaurant_id": visit.restaurant_id,
                    "phone": visit.customer.phone,
                },
            )
        logger.exception(
            "send_feedback_message_whatsapp_failed",
            extra={"visit_id": visit_id, "phone": visit.customer.phone},
        )
    except WhatsAppError:
        logger.exception(
            "send_feedback_message_whatsapp_failed",
            extra={"visit_id": visit_id, "phone": visit.customer.phone},
        )

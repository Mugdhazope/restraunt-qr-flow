from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from typing import Any

from django.conf import settings

from kotak.integrations.whatsapp.client import WhatsAppClient
from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError
from kotak.integrations.whatsapp.exceptions import WhatsAppError
from kotak.integrations.whatsapp.services import WhatsAppService

if TYPE_CHECKING:
    from kotak.customers.models import Customer
    from kotak.restaurants.models import Restaurant

logger = logging.getLogger(__name__)

_MAX_FAILURE_SAMPLES = 25
_META_TEMPLATE_TRANSLATION_MISSING = 132001
_META_OUTSIDE_24H_SESSION = 131047


def _whatsapp_user_message(exc: WhatsAppError) -> str:
    if isinstance(exc, WhatsAppAPIError):
        return exc.user_message()
    return str(exc)


def whatsapp_client_for_restaurant(restaurant: Restaurant) -> WhatsAppClient:
    token = (restaurant.whatsapp_api_token or "").strip() or (
        getattr(settings, "WHATSAPP_ACCESS_TOKEN", "") or ""
    ).strip()
    phone_id = (restaurant.whatsapp_phone_number_id or "").strip() or (
        getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "") or ""
    ).strip()
    return WhatsAppClient(access_token=token or None, phone_number_id=phone_id or None)


def send_campaign_messages(
    restaurant: Restaurant,
    customers_qs,
    message: str,
) -> dict[str, Any]:
    """Send campaign text using Meta template if configured, else session text."""
    client = whatsapp_client_for_restaurant(restaurant)
    service = WhatsAppService(client=client)
    customers: list[Customer] = list(customers_qs)
    sent = 0
    failed = 0
    failures: list[dict[str, Any]] = []
    recipient_events: list[dict[str, Any]] = []

    template_name = (restaurant.whatsapp_broadcast_template_name or "").strip()
    lang_raw = restaurant.whatsapp_broadcast_template_language or "en"
    template_lang = str(lang_raw).strip() or "en"

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

    def _send_one(phone: str) -> dict[str, Any]:
        if template_name:
            languages = _template_language_candidates(template_lang)
            last_exc: WhatsAppError | None = None
            for idx, lang in enumerate(languages):
                try:
                    provider_response = service.send_template(
                        phone,
                        template_name=template_name,
                        language_code=lang,
                        body_parameters=[message],
                    )
                    if idx > 0:
                        logger.info(
                            "campaign_whatsapp_template_language_fallback_succeeded",
                            extra={
                                "restaurant_id": restaurant.id,
                                "from_language": template_lang,
                                "used_language": lang,
                            },
                        )
                    return provider_response
                except WhatsAppAPIError as exc:
                    last_exc = exc
                    can_retry = exc.meta_code == _META_TEMPLATE_TRANSLATION_MISSING and idx < len(languages) - 1
                    if can_retry:
                        logger.warning(
                            "campaign_whatsapp_template_language_retry",
                            extra={
                                "restaurant_id": restaurant.id,
                                "template_name": template_name,
                                "attempt_language": lang,
                                "next_language": languages[idx + 1],
                            },
                        )
                        continue
                    raise
            if last_exc is not None:
                raise last_exc
        else:
            try:
                return service.send_text(phone=phone, message=message)
            except WhatsAppAPIError as exc:
                # Campaigns often target users outside the 24h session window.
                # If a broadcast template is configured, auto-fallback to template send.
                if exc.meta_code != _META_OUTSIDE_24H_SESSION or not template_name:
                    raise
                languages = _template_language_candidates(template_lang)
                last_exc: WhatsAppError | None = None
                for idx, lang in enumerate(languages):
                    try:
                        provider_response = service.send_template(
                            phone,
                            template_name=template_name,
                            language_code=lang,
                            body_parameters=[message],
                        )
                        logger.info(
                            "campaign_whatsapp_fallback_to_template_after_24h",
                            extra={
                                "restaurant_id": restaurant.id,
                                "template_name": template_name,
                                "used_language": lang,
                                "had_language_fallback": idx > 0,
                            },
                        )
                        return provider_response
                    except WhatsAppAPIError as tpl_exc:
                        last_exc = tpl_exc
                        can_retry = (
                            tpl_exc.meta_code == _META_TEMPLATE_TRANSLATION_MISSING
                            and idx < len(languages) - 1
                        )
                        if can_retry:
                            logger.warning(
                                "campaign_whatsapp_template_language_retry_after_24h",
                                extra={
                                    "restaurant_id": restaurant.id,
                                    "template_name": template_name,
                                    "attempt_language": lang,
                                    "next_language": languages[idx + 1],
                                },
                            )
                            continue
                        raise
                if last_exc is not None:
                    raise last_exc

    for i, customer in enumerate(customers):
        try:
            provider_response = _send_one(customer.phone)
            sent += 1
            messages = provider_response.get("messages") if isinstance(provider_response, dict) else None
            wamid = ""
            if isinstance(messages, list) and messages and isinstance(messages[0], dict):
                wamid = str(messages[0].get("id") or "")
            recipient_events.append(
                {
                    "customer_id": customer.id,
                    "phone": customer.phone,
                    "status": "sent",
                    "wamid": wamid,
                },
            )
        except WhatsAppError as exc:
            failed += 1
            user_msg = _whatsapp_user_message(exc)
            meta_code = exc.meta_code if isinstance(exc, WhatsAppAPIError) else None
            if len(failures) < _MAX_FAILURE_SAMPLES:
                failures.append(
                    {
                        "customer_id": customer.id,
                        "phone": customer.phone,
                        "error": user_msg,
                    },
                )
            recipient_events.append(
                {
                    "customer_id": customer.id,
                    "phone": customer.phone,
                    "status": "failed",
                    "wamid": "",
                    "error": user_msg,
                    "meta_error_code": meta_code,
                },
            )
            is_token = isinstance(exc, WhatsAppAPIError) and exc.is_access_token_error
            log_exc = not is_token
            logger.warning(
                "campaign_whatsapp_send_failed",
                extra={"customer_id": customer.id, "restaurant_id": restaurant.id},
                exc_info=log_exc,
            )
            if isinstance(exc, WhatsAppAPIError) and exc.is_access_token_error:
                remaining = customers[i + 1 :]
                if remaining:
                    logger.warning(
                        "campaign_whatsapp_skipped_remaining_after_token_error",
                        extra={
                            "restaurant_id": restaurant.id,
                            "skipped": len(remaining),
                        },
                    )
                for other in remaining:
                    failed += 1
                    if len(failures) < _MAX_FAILURE_SAMPLES:
                        failures.append(
                            {
                                "customer_id": other.id,
                                "phone": other.phone,
                                "error": user_msg,
                            },
                        )
                    recipient_events.append(
                        {
                            "customer_id": other.id,
                            "phone": other.phone,
                            "status": "failed",
                            "wamid": "",
                            "error": user_msg,
                            "meta_error_code": exc.meta_code,
                        },
                    )
                break

    error_summary = failures[0]["error"] if failures else None
    return {
        "recipient_count": len(customers),
        "sent": sent,
        "failed": failed,
        "failures": failures,
        "error_summary": error_summary,
        "recipient_events": recipient_events,
    }

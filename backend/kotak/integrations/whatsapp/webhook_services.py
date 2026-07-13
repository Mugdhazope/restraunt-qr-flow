# ruff: noqa: TC001, PLR0911, PLR2004, E501
from __future__ import annotations

import logging

from django.conf import settings
from django.db.models import F
from django.db.models import Q
from django.utils import timezone

from kotak.campaigns.models import CampaignRecipientEvent
from kotak.campaigns.services import sync_campaign_rollup
from kotak.customers.models import Customer
from kotak.dashboard.services.automations import get_or_create_rule
from kotak.dashboard.services.automations import send_automation_message
from kotak.dashboard.services.whatsapp_dispatch import whatsapp_client_for_restaurant
from kotak.feedback.models import Feedback
from kotak.feedback.models import Sentiment
from kotak.restaurants.models import Restaurant

from .exceptions import WhatsAppError
from .exceptions import meta_outbound_delivery_hint
from .parsers import ParsedWhatsAppMessage
from .services import WhatsAppService

logger = logging.getLogger(__name__)


def _digits_only(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit())


def _candidate_restaurants_for_waba(phone_number_id: str) -> list[Restaurant]:
    """Restaurants for this WABA phone number id.

    Prefer an exact ``Restaurant.whatsapp_phone_number_id`` match. If none match but
    the webhook id equals ``settings.WHATSAPP_PHONE_NUMBER_ID`` (shared Cloud API
    number), fall back to outlets with a blank id so inbound feedback still resolves
    when Settings UI has not stored the id yet (phone match disambiguates).
    """
    pid = str(phone_number_id).strip()
    if not pid:
        return []
    direct = list(Restaurant.objects.filter(whatsapp_phone_number_id=pid))
    if direct:
        return direct
    env_pid = (getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "") or "").strip()
    if env_pid and pid == env_pid:
        return list(Restaurant.objects.filter(Q(whatsapp_phone_number_id="")))
    return []


def _customer_for_restaurants_and_phone(
    restaurants: list[Restaurant],
    parsed_phone: str,
) -> Customer | None:
    """Match Customer.phone to webhook sender within candidate restaurants (digits-only)."""
    if not restaurants:
        return None
    target = _digits_only(parsed_phone)
    matches = [
        c
        for c in Customer.objects.filter(restaurant__in=restaurants).order_by("id")
        if _digits_only(c.phone) == target
    ]
    return matches[-1] if matches else None


def _status_dicts_from_payload(payload: dict) -> list[dict]:
    out: list[dict] = []
    for entry in payload.get("entry") or []:
        if not isinstance(entry, dict):
            continue
        for change in entry.get("changes") or []:
            if not isinstance(change, dict):
                continue
            value = change.get("value")
            if not isinstance(value, dict):
                continue
            raw = value.get("statuses") or []
            out.extend(st for st in raw if isinstance(st, dict))
    return out


def _log_outbound_status(st: dict) -> None:
    status = st.get("status")
    recipient = st.get("recipient_id")
    wamid = st.get("id")
    errs_raw = st.get("errors")
    errs: list = errs_raw if isinstance(errs_raw, list) else []

    if status == "failed" and errs:
        for err in errs:
            if not isinstance(err, dict):
                continue
            code = err.get("code")
            meta_code = int(code) if isinstance(code, int) else None
            err_data = err.get("error_data")
            details = ""
            if isinstance(err_data, dict):
                details = str(err_data.get("details") or "")
            hint = meta_outbound_delivery_hint(meta_code) or ""
            logger.warning(
                "whatsapp_outbound_message_failed status=%s recipient=%s wamid=%s "
                "meta_code=%s details=%s hint=%s",
                status,
                recipient,
                wamid,
                meta_code,
                details[:300] if details else "",
                hint,
                extra={
                    "meta_error_code": meta_code,
                    "recipient_id": recipient,
                    "wamid": wamid,
                },
            )
        return

    if status in ("delivered", "read", "sent"):
        logger.info(
            "whatsapp_outbound_message_status status=%s recipient=%s wamid=%s",
            status,
            recipient,
            wamid,
        )


def _sync_recipient_status(st: dict) -> None:
    status = str(st.get("status") or "").strip()
    if status not in {"sent", "delivered", "read", "failed"}:
        return
    wamid = str(st.get("id") or "").strip()
    recipient = str(st.get("recipient_id") or "").strip()
    event = None
    if wamid:
        event = CampaignRecipientEvent.objects.filter(wamid=wamid).order_by("-id").first()
    if event is None and recipient:
        event = (
            CampaignRecipientEvent.objects.filter(phone__endswith=recipient[-10:])
            .select_related("campaign_send")
            .order_by("-id")
            .first()
        )
    if event is None:
        return
    now = timezone.now()
    update_fields = ["status", "last_status_payload", "updated_at"]
    event.last_status_payload = st
    if status == "sent":
        event.status = "sent"
        if event.sent_at is None:
            event.sent_at = now
            update_fields.append("sent_at")
    elif status == "delivered":
        event.status = "delivered"
        if event.delivered_at is None:
            event.delivered_at = now
            update_fields.append("delivered_at")
    elif status == "read":
        event.status = "read"
        event.read_count += 1
        event.read_at = now
        update_fields.extend(["read_count", "read_at"])
    elif status == "failed":
        event.status = "failed"
        event.failed_at = now
        update_fields.append("failed_at")
        errs = st.get("errors") or []
        if isinstance(errs, list) and errs and isinstance(errs[0], dict):
            first = errs[0]
            code = first.get("code")
            event.meta_error_code = int(code) if isinstance(code, int) else None
            event.failure_details = str((first.get("error_data") or {}).get("details") or "")
            update_fields.extend(["meta_error_code", "failure_details"])
    event.save(update_fields=sorted(set(update_fields)))
    sync_campaign_rollup(event.campaign_send)


class WhatsAppWebhookService:
    def __init__(self, whatsapp_service: WhatsAppService | None = None):
        # Tests pass a stub; production uses per-restaurant clients for outbound replies.
        self._whatsapp_service_override = whatsapp_service

    def _whatsapp_service_for_restaurant(self, restaurant: Restaurant) -> WhatsAppService:
        if self._whatsapp_service_override is not None:
            return self._whatsapp_service_override
        return WhatsAppService(client=whatsapp_client_for_restaurant(restaurant))

    def process_outbound_statuses(self, payload: dict) -> str:
        """Log delivery/read/failed updates for outbound messages (campaign sends, etc.)."""
        statuses = _status_dicts_from_payload(payload)
        if not statuses:
            return "no_statuses"
        for st in statuses:
            _log_outbound_status(st)
            _sync_recipient_status(st)
        return f"statuses_{len(statuses)}"

    def process_inbound_message(self, parsed: ParsedWhatsAppMessage | None) -> str:
        if parsed is None:
            return "ignored_none"

        body = parsed.message.strip()
        if not body:
            return "ignored_empty"

        candidates = _candidate_restaurants_for_waba(parsed.phone_number_id)
        if not candidates:
            logger.warning(
                "whatsapp_feedback_no_restaurant_for_waba",
                extra={"phone_number_id": parsed.phone_number_id, "phone": parsed.phone},
            )
            self._log_inbound(parsed.phone, "missing_restaurant")
            return "ignored_no_restaurant"

        customer = _customer_for_restaurants_and_phone(candidates, parsed.phone)
        if customer is None:
            logger.warning(
                "whatsapp_feedback_no_customer",
                extra={
                    "phone": parsed.phone,
                    "restaurant_ids": [r.id for r in candidates],
                    "phone_number_id": parsed.phone_number_id,
                },
            )
            self._log_inbound(parsed.phone, "missing_customer")
            return "ignored_no_customer"

        restaurant = customer.restaurant

        open_feedback = (
            Feedback.objects.filter(
                customer=customer,
                restaurant=restaurant,
                is_complete=False,
            )
            .order_by("-id")
            .first()
        )

        if open_feedback is not None:
            self._track_reply_event(customer)
            return self._complete_with_comment(parsed.phone, open_feedback, body, restaurant)

        self._track_reply_event(customer)
        return self._try_record_rating(parsed.phone, customer, restaurant, body)

    def process_rating_message(self, parsed: ParsedWhatsAppMessage | None) -> str:
        """Backward-compatible alias for :meth:`process_inbound_message`."""
        return self.process_inbound_message(parsed)

    def _try_record_rating(
        self,
        phone: str,
        customer: Customer,
        restaurant: Restaurant,
        body: str,
    ) -> str:
        if not body.isdigit():
            self._log_inbound(phone, "ignored_non_numeric")
            return "ignored_non_numeric"

        rating = int(body)
        if rating < 1 or rating > 5:
            self._log_inbound(phone, "ignored_out_of_range", rating=rating)
            return "ignored_out_of_range"

        sentiment = Sentiment.POSITIVE if rating >= 4 else Sentiment.NEGATIVE
        if rating >= 4:
            Feedback.objects.create(
                customer=customer,
                restaurant=restaurant,
                rating=rating,
                message="",
                sentiment=sentiment,
                is_complete=True,
            )
            self._send_google_review_prompt(phone, restaurant)
            self._log_inbound(phone, "rating_completed_google", rating=rating)
            return "rating_completed_google"

        Feedback.objects.create(
            customer=customer,
            restaurant=restaurant,
            rating=rating,
            message="",
            sentiment=sentiment,
            is_complete=False,
        )
        self._send_comment_prompt(phone, restaurant)
        self._log_inbound(phone, "rating_recorded", rating=rating)
        return "rating_recorded"

    def _complete_with_comment(
        self,
        phone: str,
        feedback: Feedback,
        body: str,
        restaurant: Restaurant,
    ) -> str:
        feedback.message = body
        feedback.is_complete = True
        feedback.save(update_fields=["message", "is_complete"])

        if feedback.rating >= 4:
            self._send_google_review_prompt(phone, restaurant)
            self._log_inbound(phone, "comment_completed_google", rating=feedback.rating)
            return "comment_completed_google"

        self._log_inbound(phone, "comment_completed", rating=feedback.rating)
        return "comment_completed"

    def _send_comment_prompt(self, phone: str, restaurant: Restaurant) -> None:
        label = restaurant.name.strip() or "us"
        message = (
            f"Thanks for visiting {label}! We'd love to hear more.\n"
            "What did you like about your experience?"
        )
        try:
            self._whatsapp_service_for_restaurant(restaurant).send_text(
                phone=phone,
                message=message,
            )
        except WhatsAppError:
            logger.exception(
                "comment_prompt_whatsapp_failed",
                extra={"phone": phone},
            )

    def _send_google_review_prompt(self, phone: str, restaurant: Restaurant) -> None:
        link = (restaurant.google_review_link or "").strip() or (getattr(settings, "DEFAULT_GOOGLE_REVIEW_LINK", "") or "").strip()
        if not link:
            logger.info(
                "google_review_link_skipped_empty",
                extra={"restaurant_id": restaurant.id, "phone": phone},
            )
            return
        try:
            rule = get_or_create_rule(restaurant, "positive_feedback")
            if not rule.enabled:
                return
            if send_automation_message(restaurant, phone, "positive_feedback"):
                Restaurant.objects.filter(pk=restaurant.pk).update(
                    google_review_prompts_sent=F("google_review_prompts_sent") + 1,
                )
        except WhatsAppError:
            logger.exception(
                "google_review_prompt_whatsapp_failed",
                extra={"restaurant_id": restaurant.id, "phone": phone},
            )

    def _log_inbound(self, phone: str, action: str, *, rating: int | None = None) -> None:
        logger.info(
            "whatsapp_feedback_processed",
            extra={"phone": phone, "rating": rating, "action": action},
        )

    def _track_reply_event(self, customer: Customer) -> None:
        event = (
            CampaignRecipientEvent.objects.filter(customer=customer)
            .select_related("campaign_send")
            .order_by("-created_at")
            .first()
        )
        if event is None:
            return
        event.reply_count += 1
        event.replied_at = timezone.now()
        if event.status != "failed":
            event.status = "replied"
        event.save(update_fields=["reply_count", "replied_at", "status", "updated_at"])
        sync_campaign_rollup(event.campaign_send)

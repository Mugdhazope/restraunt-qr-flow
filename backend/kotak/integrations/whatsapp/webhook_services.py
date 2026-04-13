# ruff: noqa: TC001, PLR0911, PLR2004, FBT003, E501
from __future__ import annotations

import logging

from django.conf import settings

from kotak.customers.models import Customer
from kotak.feedback.models import Feedback
from kotak.feedback.models import Sentiment
from kotak.restaurants.models import Restaurant

from .exceptions import WhatsAppError
from .parsers import ParsedWhatsAppMessage
from .services import WhatsAppService

logger = logging.getLogger(__name__)


def _digits_only(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit())


def _candidate_restaurants_for_waba(phone_number_id: str) -> list[Restaurant]:
    """Restaurants that may receive webhooks for this WABA ``phone_number_id``."""
    pid = str(phone_number_id).strip()
    if not pid:
        return []

    direct = list(Restaurant.objects.filter(whatsapp_phone_number_id=pid))
    if direct:
        return direct

    env_pid = str(getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "") or "").strip()
    if not env_pid or env_pid != pid:
        return []

    blank = list(Restaurant.objects.filter(whatsapp_phone_number_id="").order_by("id"))
    all_rows = list(Restaurant.objects.all().order_by("id"))
    if len(blank) == 1:
        r_blank = blank[0]
        logger.info(
            "whatsapp_waba_fallback_single_blank_id",
            extra={"phone_number_id": pid, "restaurant_id": r_blank.id},
        )
        return [r_blank]
    if len(all_rows) == 1:
        only = all_rows[0]
        logger.info(
            "whatsapp_waba_fallback_single_row",
            extra={"phone_number_id": pid, "restaurant_id": only.id},
        )
        return [only]
    # Shared env WABA across several restaurants (typical in dev): match customer by phone.
    if blank:
        logger.info(
            "whatsapp_waba_fallback_multi_blank_shared_env",
            extra={"phone_number_id": pid, "restaurant_ids": [r.id for r in blank]},
        )
        return blank
    logger.info(
        "whatsapp_waba_fallback_multi_no_blank_using_all",
        extra={"phone_number_id": pid, "restaurant_ids": [r.id for r in all_rows]},
    )
    return all_rows


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


class WhatsAppWebhookService:
    def __init__(self, whatsapp_service: WhatsAppService | None = None):
        self.whatsapp_service = whatsapp_service or WhatsAppService()

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
            return self._complete_with_comment(parsed.phone, open_feedback, body, restaurant)

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
        Feedback.objects.create(
            customer=customer,
            restaurant=restaurant,
            rating=rating,
            message="",
            sentiment=sentiment,
            is_complete=False,
        )
        self._send_comment_prompt(phone)
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

    def _send_comment_prompt(self, phone: str) -> None:
        message = (
            "Thanks! We'd love to hear more.\n"
            "What did you like about your experience?"
        )
        try:
            self.whatsapp_service.send_text(phone=phone, message=message)
        except WhatsAppError:
            logger.exception(
                "comment_prompt_whatsapp_failed",
                extra={"phone": phone},
            )

    def _send_google_review_prompt(self, phone: str, restaurant: Restaurant) -> None:
        link = (restaurant.google_review_link or "").strip() or (
            getattr(settings, "DEFAULT_GOOGLE_REVIEW_LINK", "") or ""
        ).strip()
        if not link:
            logger.info(
                "google_review_link_skipped_empty",
                extra={"restaurant_id": restaurant.id, "phone": phone},
            )
            return
        message = f"Awesome! 🙌 Please leave us a review here:\n{link}"
        try:
            self.whatsapp_service.send_text(phone=phone, message=message)
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

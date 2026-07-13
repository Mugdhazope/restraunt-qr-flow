# ruff: noqa: TRY003, EM101, E501
from __future__ import annotations

import logging
import secrets
from datetime import timedelta
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from kotak.accounts.models import OTP
from kotak.dashboard.services.whatsapp_dispatch import whatsapp_client_for_restaurant
from kotak.integrations.sms.exceptions import SMSAPIError
from kotak.integrations.sms.exceptions import SMSConfigError
from kotak.integrations.sms.services import SMSService
from kotak.integrations.whatsapp.exceptions import WhatsAppError
from kotak.integrations.whatsapp.services import WhatsAppService

if TYPE_CHECKING:
    from kotak.restaurants.models import Restaurant

logger = logging.getLogger(__name__)


class OTPError(Exception):
    """Base OTP domain error."""


class OTPRateLimitError(OTPError):
    """Raised when OTP send or verify rate limit is exceeded."""


class OTPVerificationError(OTPError):
    """Raised when OTP verification fails."""


class OTPDeliveryConfigError(OTPError):
    """Raised when neither SMS nor WhatsApp OTP delivery is configured."""


class OTPService:
    MAX_SENDS_PER_WINDOW = 3
    MAX_VERIFY_ATTEMPTS_PER_WINDOW = 5

    def __init__(self, sms_service: SMSService | None = None):
        self.sms_service = sms_service or SMSService()

    @staticmethod
    def _sms_service_for_restaurant(restaurant: Restaurant) -> SMSService:
        return SMSService(
            api_key=(getattr(restaurant, "sms_api_key", "") or None),
            sender_id=(getattr(restaurant, "sms_sender_id", "") or None),
            template_id=(getattr(restaurant, "sms_template_id", "") or None),
        )

    @staticmethod
    def _expiry_seconds() -> int:
        val = int(getattr(settings, "SMS_OTP_EXPIRY_SECONDS", 300) or 300)
        return max(val, 60)

    @staticmethod
    def _window_start():
        return timezone.now() - timedelta(seconds=OTPService._expiry_seconds())

    @staticmethod
    def _verify_attempts_cache_key(phone: str, restaurant_id: int) -> str:
        return f"otp:verify_attempts:{restaurant_id}:{phone}"

    def _assert_send_rate_limit(self, phone: str, restaurant: Restaurant) -> None:
        recent_count = OTP.objects.filter(
            restaurant=restaurant,
            phone=phone,
            created_at__gte=self._window_start(),
        ).count()
        if recent_count >= self.MAX_SENDS_PER_WINDOW:
            raise OTPRateLimitError("Too many OTP requests. Please try again later.")

    def _increment_verify_attempts(self, phone: str, restaurant_id: int) -> int:
        key = self._verify_attempts_cache_key(phone, restaurant_id)
        attempts = cache.get(key, 0) + 1
        cache.set(key, attempts, timeout=self._expiry_seconds())
        return attempts

    def _reset_verify_attempts(self, phone: str, restaurant_id: int) -> None:
        cache.delete(self._verify_attempts_cache_key(phone, restaurant_id))

    def generate_otp(self, *, phone: str, restaurant: Restaurant) -> str:
        otp_code = f"{secrets.randbelow(10**6):06d}"
        OTP.objects.create(
            restaurant=restaurant,
            phone=phone,
            code=otp_code,
            is_verified=False,
            is_used=False,
            expires_at=timezone.now() + timedelta(seconds=self._expiry_seconds()),
        )
        logger.info("OTP generated", extra={"phone": phone, "restaurant_id": restaurant.id})
        return otp_code

    @staticmethod
    def _sms_fully_configured(restaurant: Restaurant) -> bool:
        api = (getattr(restaurant, "sms_api_key", "") or "").strip() or (
            getattr(settings, "SMS_API_KEY", "") or ""
        ).strip()
        sender = (getattr(restaurant, "sms_sender_id", "") or "").strip() or (
            getattr(settings, "SMS_SENDER_ID", "") or ""
        ).strip()
        tpl = (getattr(restaurant, "sms_template_id", "") or "").strip() or (
            getattr(settings, "SMS_TEMPLATE_ID", "") or ""
        ).strip()
        return bool(api and sender and tpl)

    @staticmethod
    def _whatsapp_otp_template_configured(restaurant: Restaurant) -> bool:
        name = (restaurant.whatsapp_otp_template_name or "").strip() or (
            getattr(settings, "WHATSAPP_OTP_TEMPLATE_NAME", "") or ""
        ).strip()
        return bool(name)

    def _send_otp_whatsapp(self, *, phone: str, otp_code: str, restaurant: Restaurant) -> None:
        template_name = (restaurant.whatsapp_otp_template_name or "").strip() or (
            getattr(settings, "WHATSAPP_OTP_TEMPLATE_NAME", "") or ""
        ).strip()
        language_code = (restaurant.whatsapp_otp_template_language or "").strip() or (
            getattr(settings, "WHATSAPP_OTP_TEMPLATE_LANGUAGE", "") or "en"
        ).strip()
        svc = WhatsAppService(client=whatsapp_client_for_restaurant(restaurant))
        svc.send_otp(
            phone,
            otp_code,
            template_name=template_name or None,
            language_code=language_code,
        )

    def send_otp(self, *, phone: str, restaurant: Restaurant) -> str:
        """Deliver OTP; returns ``\"sms\"`` or ``\"whatsapp\"``."""
        self._assert_send_rate_limit(phone, restaurant)
        otp_code = self.generate_otp(phone=phone, restaurant=restaurant)

        sms_ready = self._sms_fully_configured(restaurant)
        wa_ready = self._whatsapp_otp_template_configured(restaurant)
        if not sms_ready and not wa_ready:
            raise OTPDeliveryConfigError(
                "OTP delivery is not configured. Set MSG91 (SMS_API_KEY, SMS_SENDER_ID, "
                "SMS_TEMPLATE_ID) on the server or per restaurant, and/or set WhatsApp OTP "
                "template in Dashboard → Settings (whatsapp_otp_template_name + language).",
            )

        sms_error: SMSAPIError | SMSConfigError | None = None
        if sms_ready:
            try:
                if self.sms_service.__class__ is SMSService:
                    sms = self._sms_service_for_restaurant(restaurant)
                else:
                    sms = self.sms_service
                sms.send_otp(phone=phone, otp_code=otp_code)
            except (SMSConfigError, SMSAPIError) as exc:
                sms_error = exc
                logger.warning(
                    "otp_sms_send_failed",
                    extra={"phone": phone, "restaurant_id": restaurant.id, "error": str(exc)},
                )
            else:
                logger.info("OTP sent via SMS", extra={"phone": phone, "restaurant_id": restaurant.id})
                return "sms"

        if wa_ready:
            try:
                self._send_otp_whatsapp(phone=phone, otp_code=otp_code, restaurant=restaurant)
            except WhatsAppError:
                logger.exception(
                    "otp_whatsapp_send_failed",
                    extra={"phone": phone, "restaurant_id": restaurant.id},
                )
                if sms_error is not None:
                    raise sms_error from None
                raise
            logger.info("OTP sent via WhatsApp", extra={"phone": phone, "restaurant_id": restaurant.id})
            return "whatsapp"

        if sms_error is not None:
            raise sms_error
        raise OTPDeliveryConfigError("No working OTP delivery channel.")

    @transaction.atomic
    def verify_otp(self, *, phone: str, code: str, restaurant: Restaurant) -> bool:
        attempts = cache.get(self._verify_attempts_cache_key(phone, restaurant.id), 0)
        if attempts >= self.MAX_VERIFY_ATTEMPTS_PER_WINDOW:
            raise OTPRateLimitError("Too many OTP verification attempts. Please try again later.")

        otp = (
            OTP.objects.select_for_update()
            .filter(restaurant=restaurant, phone=phone)
            .order_by("-created_at")
            .first()
        )
        if otp is None:
            self._increment_verify_attempts(phone, restaurant.id)
            raise OTPVerificationError("OTP not found")

        if otp.is_verified or otp.is_used:
            self._increment_verify_attempts(phone, restaurant.id)
            raise OTPVerificationError("OTP already used")

        expires_at = otp.expires_at or (otp.created_at + timedelta(seconds=self._expiry_seconds()))
        if expires_at < timezone.now():
            self._increment_verify_attempts(phone, restaurant.id)
            raise OTPVerificationError("OTP expired")

        if otp.code != code:
            self._increment_verify_attempts(phone, restaurant.id)
            raise OTPVerificationError("Invalid OTP")

        otp.is_verified = True
        otp.is_used = True
        otp.save(update_fields=["is_verified", "is_used"])
        self._reset_verify_attempts(phone, restaurant.id)
        logger.info("OTP verified", extra={"phone": phone, "restaurant_id": restaurant.id})
        return True

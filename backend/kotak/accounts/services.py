# ruff: noqa: TRY003, EM101, E501
from __future__ import annotations

import logging
import secrets
from datetime import timedelta

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from kotak.accounts.models import OTP
from kotak.integrations.whatsapp.services import WhatsAppService

logger = logging.getLogger(__name__)


class OTPError(Exception):
    """Base OTP domain error."""


class OTPRateLimitError(OTPError):
    """Raised when OTP send or verify rate limit is exceeded."""


class OTPVerificationError(OTPError):
    """Raised when OTP verification fails."""


class OTPService:
    OTP_EXPIRY_MINUTES = 5
    MAX_SENDS_PER_WINDOW = 3
    MAX_VERIFY_ATTEMPTS_PER_WINDOW = 5

    def __init__(self, whatsapp_service: WhatsAppService | None = None):
        self.whatsapp_service = whatsapp_service or WhatsAppService()

    @staticmethod
    def _window_start():
        return timezone.now() - timedelta(minutes=OTPService.OTP_EXPIRY_MINUTES)

    @staticmethod
    def _verify_attempts_cache_key(phone: str) -> str:
        return f"otp:verify_attempts:{phone}"

    def _assert_send_rate_limit(self, phone: str) -> None:
        recent_count = OTP.objects.filter(
            phone=phone,
            created_at__gte=self._window_start(),
        ).count()
        if recent_count >= self.MAX_SENDS_PER_WINDOW:
            raise OTPRateLimitError("Too many OTP requests. Please try again later.")

    def _increment_verify_attempts(self, phone: str) -> int:
        key = self._verify_attempts_cache_key(phone)
        attempts = cache.get(key, 0) + 1
        cache.set(key, attempts, timeout=self.OTP_EXPIRY_MINUTES * 60)
        return attempts

    def _reset_verify_attempts(self, phone: str) -> None:
        cache.delete(self._verify_attempts_cache_key(phone))

    def generate_otp(self, phone: str) -> str:
        otp_code = f"{secrets.randbelow(10**6):06d}"
        OTP.objects.create(phone=phone, code=otp_code, is_verified=False)
        logger.info("OTP generated", extra={"phone": phone})
        return otp_code

    def send_otp(self, phone: str) -> None:
        self._assert_send_rate_limit(phone)
        otp_code = self.generate_otp(phone)
        self.whatsapp_service.send_otp(phone=phone, otp_code=otp_code)
        logger.info("OTP sent via WhatsApp", extra={"phone": phone})

    @transaction.atomic
    def verify_otp(self, phone: str, code: str) -> bool:
        attempts = cache.get(self._verify_attempts_cache_key(phone), 0)
        if attempts >= self.MAX_VERIFY_ATTEMPTS_PER_WINDOW:
            raise OTPRateLimitError("Too many OTP verification attempts. Please try again later.")

        otp = OTP.objects.select_for_update().filter(phone=phone).order_by("-created_at").first()
        if otp is None:
            self._increment_verify_attempts(phone)
            raise OTPVerificationError("OTP not found")

        if otp.is_verified:
            self._increment_verify_attempts(phone)
            raise OTPVerificationError("OTP already used")

        if otp.created_at < self._window_start():
            self._increment_verify_attempts(phone)
            raise OTPVerificationError("OTP expired")

        if otp.code != code:
            self._increment_verify_attempts(phone)
            raise OTPVerificationError("Invalid OTP")

        otp.is_verified = True
        otp.save(update_fields=["is_verified"])
        self._reset_verify_attempts(phone)
        logger.info("OTP verified", extra={"phone": phone})
        return True

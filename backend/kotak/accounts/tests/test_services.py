# ruff: noqa: I001
from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from kotak.accounts.models import OTP
from kotak.accounts.services import OTPRateLimitError
from kotak.accounts.services import OTPService
from kotak.accounts.services import OTPVerificationError


OTP_LENGTH = 6


class DummyWhatsAppService:
    def __init__(self):
        self.sent = []

    def send_otp(self, phone: str, otp_code: str) -> None:
        self.sent.append((phone, otp_code))


@pytest.mark.django_db
class TestOTPService:
    def test_generate_otp_creates_6_digit_code(self):
        service = OTPService(whatsapp_service=DummyWhatsAppService())

        otp = service.generate_otp(phone="+919999999999")

        assert len(otp) == OTP_LENGTH
        assert otp.isdigit()
        assert OTP.objects.filter(
            phone="+919999999999",
            code=otp,
            is_verified=False,
        ).exists()

    def test_send_otp_rate_limited_after_3_requests(self):
        service = OTPService(whatsapp_service=DummyWhatsAppService())
        phone = "+919999999998"

        service.send_otp(phone)
        service.send_otp(phone)
        service.send_otp(phone)

        with pytest.raises(OTPRateLimitError):
            service.send_otp(phone)

    def test_verify_fails_for_expired_otp(self):
        service = OTPService(whatsapp_service=DummyWhatsAppService())
        otp = OTP.objects.create(
            phone="+919999999997",
            code="123456",
            is_verified=False,
        )
        OTP.objects.filter(id=otp.id).update(
            created_at=timezone.now()
            - timedelta(minutes=OTPService.OTP_EXPIRY_MINUTES + 1),
        )

        with pytest.raises(OTPVerificationError):
            service.verify_otp(phone="+919999999997", code="123456")

    def test_verify_marks_otp_as_used(self):
        service = OTPService(whatsapp_service=DummyWhatsAppService())
        OTP.objects.create(phone="+919999999996", code="654321", is_verified=False)

        assert service.verify_otp(phone="+919999999996", code="654321") is True
        assert OTP.objects.filter(
            phone="+919999999996",
            code="654321",
            is_verified=True,
        ).exists()

    def test_verify_rejects_already_used_otp(self):
        service = OTPService(whatsapp_service=DummyWhatsAppService())
        OTP.objects.create(phone="+919999999995", code="222222", is_verified=True)

        with pytest.raises(OTPVerificationError):
            service.verify_otp(phone="+919999999995", code="222222")

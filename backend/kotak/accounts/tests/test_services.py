# ruff: noqa: I001
from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from kotak.accounts.models import OTP
from kotak.accounts.services import OTPDeliveryConfigError
from kotak.accounts.services import OTPRateLimitError
from kotak.accounts.services import OTPService
from kotak.accounts.services import OTPVerificationError
from kotak.restaurants.models import Restaurant


OTP_LENGTH = 6


@pytest.fixture(autouse=True)
def _sms_test_settings(settings):
    settings.SMS_API_KEY = "test-sms-key"
    settings.SMS_SENDER_ID = "DOUGHJ"
    settings.SMS_TEMPLATE_ID = "tmpl-1"


class DummySMSService:
    def __init__(self):
        self.sent: list[tuple[str, str]] = []

    def send_otp(self, *, phone: str, otp_code: str) -> None:
        self.sent.append((phone, otp_code))


@pytest.mark.django_db
class TestOTPService:
    @pytest.fixture
    def restaurant(self):
        return Restaurant.objects.create(name="Dough & Joe", slug="dough-joe")

    def test_generate_otp_creates_6_digit_code(self):
        service = OTPService(sms_service=DummySMSService())
        restaurant = Restaurant.objects.create(name="R1", slug="r1")

        otp = service.generate_otp(phone="+919999999999", restaurant=restaurant)

        assert len(otp) == OTP_LENGTH
        assert otp.isdigit()
        assert OTP.objects.filter(
            restaurant=restaurant,
            phone="+919999999999",
            code=otp,
            is_verified=False,
            is_used=False,
        ).exists()

    def test_send_otp_rate_limited_after_3_requests(self, restaurant):
        service = OTPService(sms_service=DummySMSService())
        phone = "+919999999998"

        assert service.send_otp(phone=phone, restaurant=restaurant) == "sms"
        assert service.send_otp(phone=phone, restaurant=restaurant) == "sms"
        assert service.send_otp(phone=phone, restaurant=restaurant) == "sms"

        with pytest.raises(OTPRateLimitError):
            service.send_otp(phone=phone, restaurant=restaurant)

    def test_send_otp_requires_sms_or_whatsapp_config(self, restaurant, settings):
        settings.SMS_API_KEY = ""
        settings.SMS_SENDER_ID = ""
        settings.SMS_TEMPLATE_ID = ""
        service = OTPService(sms_service=DummySMSService())
        with pytest.raises(OTPDeliveryConfigError):
            service.send_otp(phone="+919911111111", restaurant=restaurant)

    def test_verify_fails_for_expired_otp(self, restaurant):
        service = OTPService(sms_service=DummySMSService())
        OTP.objects.create(
            restaurant=restaurant,
            phone="+919999999997",
            code="123456",
            is_verified=False,
            is_used=False,
            expires_at=timezone.now() - timedelta(minutes=1),
        )

        with pytest.raises(OTPVerificationError):
            service.verify_otp(phone="+919999999997", code="123456", restaurant=restaurant)

    def test_verify_marks_otp_as_used(self, restaurant):
        service = OTPService(sms_service=DummySMSService())
        OTP.objects.create(
            restaurant=restaurant,
            phone="+919999999996",
            code="654321",
            is_verified=False,
            is_used=False,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        assert service.verify_otp(phone="+919999999996", code="654321", restaurant=restaurant) is True
        assert OTP.objects.filter(
            restaurant=restaurant,
            phone="+919999999996",
            code="654321",
            is_verified=True,
            is_used=True,
        ).exists()

    def test_verify_rejects_already_used_otp(self, restaurant):
        service = OTPService(sms_service=DummySMSService())
        OTP.objects.create(
            restaurant=restaurant,
            phone="+919999999995",
            code="222222",
            is_verified=True,
            is_used=True,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        with pytest.raises(OTPVerificationError):
            service.verify_otp(phone="+919999999995", code="222222", restaurant=restaurant)

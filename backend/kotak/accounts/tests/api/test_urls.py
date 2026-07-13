from django.urls import resolve
from django.urls import reverse
import pytest


def test_check_in_url():
    assert reverse("accounts_api:check-in") == "/api/auth/check-in/"
    assert resolve("/api/auth/check-in/").view_name == "accounts_api:check-in"


@pytest.mark.skip(reason="WA_DISABLED: OTP routes commented out in accounts/api/urls.py")
def test_send_otp_url():
    assert reverse("accounts_api:send-otp") == "/api/auth/send-otp/"
    assert resolve("/api/auth/send-otp/").view_name == "accounts_api:send-otp"


@pytest.mark.skip(reason="WA_DISABLED: OTP routes commented out in accounts/api/urls.py")
def test_verify_otp_url():
    assert reverse("accounts_api:verify-otp") == "/api/auth/verify-otp/"
    assert resolve("/api/auth/verify-otp/").view_name == "accounts_api:verify-otp"

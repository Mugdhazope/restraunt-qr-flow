from django.urls import resolve
from django.urls import reverse


def test_send_otp_url():
    assert reverse("accounts_api:send-otp") == "/api/auth/send-otp/"
    assert resolve("/api/auth/send-otp/").view_name == "accounts_api:send-otp"


def test_verify_otp_url():
    assert reverse("accounts_api:verify-otp") == "/api/auth/verify-otp/"
    assert resolve("/api/auth/verify-otp/").view_name == "accounts_api:verify-otp"

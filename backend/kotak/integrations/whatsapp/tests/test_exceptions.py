from __future__ import annotations

from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError
from kotak.integrations.whatsapp.exceptions import meta_outbound_delivery_hint


def test_whatsapp_api_error_user_message_expired_token():
    exc = WhatsAppAPIError(
        "WhatsApp API request failed",
        http_status=401,
        meta_code=190,
    )
    msg = exc.user_message()
    assert "token" in msg.lower()
    assert exc.is_access_token_error


def test_whatsapp_api_error_user_message_test_recipient():
    exc = WhatsAppAPIError("x", http_status=400, meta_code=131030)
    um = exc.user_message().lower()
    assert "development" in um or "test" in um


def test_meta_outbound_delivery_hint_24h():
    h = meta_outbound_delivery_hint(131047)
    assert h is not None
    assert "24-hour" in h


def test_meta_outbound_delivery_hint_unknown():
    assert meta_outbound_delivery_hint(999999) is None

from __future__ import annotations

from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError


def test_whatsapp_api_error_detects_expired_token_via_http_status():
    exc = WhatsAppAPIError("fail", http_status=401)
    assert exc.is_access_token_error is True


def test_whatsapp_api_error_detects_meta_oauth_code_190():
    exc = WhatsAppAPIError("fail", http_status=400, meta_code=190)
    assert exc.is_access_token_error is True


def test_whatsapp_api_error_other_errors_not_token():
    exc = WhatsAppAPIError("fail", http_status=400, meta_code=100)
    assert exc.is_access_token_error is False


def test_whatsapp_api_error_detects_recipient_not_allowed():
    exc = WhatsAppAPIError("fail", http_status=400, meta_code=131030)
    assert exc.is_recipient_not_in_allowed_list is True
    assert exc.is_access_token_error is False


def test_whatsapp_api_error_other_codes_not_recipient_allowlist():
    exc = WhatsAppAPIError("fail", http_status=400, meta_code=100)
    assert exc.is_recipient_not_in_allowed_list is False

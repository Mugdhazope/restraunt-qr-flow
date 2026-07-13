# ruff: noqa: S105
from __future__ import annotations

from unittest.mock import MagicMock
from unittest.mock import patch

import pytest

from kotak.integrations.sms.exceptions import SMSAPIError
from kotak.integrations.sms.msg91_client import MSG91Client


@pytest.fixture
def client() -> MSG91Client:
    return MSG91Client(
        api_key="real-auth-key",
        sender_id="SENDER",
        template_id="tmpl-1",
    )


def test_send_otp_raises_on_msg91_type_error(client: MSG91Client) -> None:
    mock_resp = MagicMock()
    mock_resp.ok = True
    mock_resp.json.return_value = {"type": "error", "message": "Invalid authkey"}

    with patch("kotak.integrations.sms.msg91_client.requests.post", return_value=mock_resp):
        with pytest.raises(SMSAPIError, match="Invalid authkey"):
            client.send_otp(phone="+919876543210", otp_code="123456")


def test_send_otp_succeeds_on_type_success(client: MSG91Client) -> None:
    mock_resp = MagicMock()
    mock_resp.ok = True
    mock_resp.json.return_value = {"type": "success", "message": "req-1"}

    with patch("kotak.integrations.sms.msg91_client.requests.post", return_value=mock_resp):
        out = client.send_otp(phone="+919876543210", otp_code="123456")

    assert out["type"] == "success"

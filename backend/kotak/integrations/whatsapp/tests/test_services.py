# ruff: noqa: I001
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from kotak.integrations.whatsapp.exceptions import WhatsAppOTPConfigError
from kotak.integrations.whatsapp.services import WhatsAppService


def test_send_otp_requires_template_name():
    svc = WhatsAppService(client=MagicMock())
    with pytest.raises(WhatsAppOTPConfigError):
        svc.send_otp(phone="+919999999999", otp_code="123456", template_name=None)

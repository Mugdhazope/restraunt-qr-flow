from __future__ import annotations

from unittest.mock import Mock
from unittest.mock import patch

import pytest

from kotak.integrations.whatsapp.client import WhatsAppClient
from kotak.integrations.whatsapp.client import sanitize_template_parameter_text

pytestmark = pytest.mark.django_db


def test_sanitize_template_parameter_text_strips_and_collapses_whitespace():
    assert sanitize_template_parameter_text("  a\nb\tc  ") == "a b c"
    assert sanitize_template_parameter_text("hello     world") == "hello world"
    assert sanitize_template_parameter_text("") == ""


def test_send_template_message_sanitizes_body_parameters(settings):
    settings.WHATSAPP_ACCESS_TOKEN = "t"  # noqa: S105
    settings.WHATSAPP_PHONE_NUMBER_ID = "p"
    response = Mock(ok=True)
    response.json = lambda: {"messages": [{"id": "x"}]}
    with patch(
        "kotak.integrations.whatsapp.client.requests.post",
        return_value=response,
    ) as post:
        client = WhatsAppClient()
        client.send_template_message(
            "+1 555 000 0000",
            template_name="tpl",
            language_code="en",
            body_parameters=["line1\nline2", "ok"],
        )
    payload = post.call_args.kwargs["json"]
    params = payload["template"]["components"][0]["parameters"]
    assert params[0]["text"] == "line1 line2"
    assert params[1]["text"] == "ok"


def test_graph_base_url_uses_whatsapp_graph_api_version_setting(settings):
    settings.WHATSAPP_GRAPH_API_VERSION = "v25.0"
    assert WhatsAppClient._graph_base_url() == "https://graph.facebook.com/v25.0"


def test_send_text_message_normalizes_local_10_digit_phone(settings):
    settings.WHATSAPP_ACCESS_TOKEN = "t"  # noqa: S105
    settings.WHATSAPP_PHONE_NUMBER_ID = "p"
    settings.WHATSAPP_DEFAULT_COUNTRY_CODE = "91"
    response = Mock(ok=True)
    response.json = lambda: {"messages": [{"id": "x"}]}
    with patch(
        "kotak.integrations.whatsapp.client.requests.post",
        return_value=response,
    ) as post:
        client = WhatsAppClient()
        client.send_text_message(to="9923207636", message="hello")
    payload = post.call_args.kwargs["json"]
    assert payload["to"] == "919923207636"


def test_send_text_message_normalizes_local_0_prefixed_phone(settings):
    settings.WHATSAPP_ACCESS_TOKEN = "t"  # noqa: S105
    settings.WHATSAPP_PHONE_NUMBER_ID = "p"
    settings.WHATSAPP_DEFAULT_COUNTRY_CODE = "91"
    response = Mock(ok=True)
    response.json = lambda: {"messages": [{"id": "x"}]}
    with patch(
        "kotak.integrations.whatsapp.client.requests.post",
        return_value=response,
    ) as post:
        client = WhatsAppClient()
        client.send_text_message(to="09923207636", message="hello")
    payload = post.call_args.kwargs["json"]
    assert payload["to"] == "919923207636"

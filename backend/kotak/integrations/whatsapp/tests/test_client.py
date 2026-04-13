from __future__ import annotations

import pytest

from kotak.integrations.whatsapp.client import WhatsAppClient

pytestmark = pytest.mark.django_db


def test_graph_base_url_uses_whatsapp_graph_api_version_setting(settings):
    settings.WHATSAPP_GRAPH_API_VERSION = "v25.0"
    assert WhatsAppClient._graph_base_url() == "https://graph.facebook.com/v25.0"

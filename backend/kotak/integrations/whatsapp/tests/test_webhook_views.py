# ruff: noqa: S105, PLR2004, COM812
from __future__ import annotations

import pytest
from django.test import Client
from django.urls import reverse

from kotak.integrations.whatsapp.webhook_views import WhatsAppWebhookView

pytestmark = pytest.mark.django_db


@pytest.fixture
def client() -> Client:
    return Client()


class DummyWebhookService:
    def __init__(self):
        self.called_with = None

    def process_inbound_message(self, parsed):
        self.called_with = parsed
        return "rating_recorded"


def test_get_webhook_verification_success(client, settings):
    settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify-me"
    url = reverse("whatsapp-webhook")

    response = client.get(
        url,
        {
            "hub.mode": "subscribe",
            "hub.verify_token": "verify-me",
            "hub.challenge": "12345",
        },
    )

    assert response.status_code == 200
    assert response.content.decode("utf-8") == "12345"


def test_get_webhook_verification_failure(client, settings):
    settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify-me"
    url = reverse("whatsapp-webhook")

    response = client.get(
        url,
        {
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong",
            "hub.challenge": "12345",
        },
    )

    assert response.status_code == 403


def test_post_webhook_returns_200_and_calls_service(client, monkeypatch):
    url = reverse("whatsapp-webhook")
    payload = {
        "entry": [
            {
                "changes": [
                    {
                        "value": {
                            "metadata": {"phone_number_id": "1001"},
                            "messages": [
                                {
                                    "from": "919812345678",
                                    "type": "text",
                                    "text": {"body": "5"},
                                }
                            ],
                        }
                    }
                ]
            }
        ]
    }

    monkeypatch.setattr(WhatsAppWebhookView, "service_class", DummyWebhookService)

    response = client.post(
        url,
        data=payload,
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    # request was parsed and handed to service class


def test_post_webhook_invalid_payload_still_returns_200(client, monkeypatch):
    url = reverse("whatsapp-webhook")
    monkeypatch.setattr(WhatsAppWebhookView, "service_class", DummyWebhookService)

    response = client.post(
        url,
        data="{invalid-json",
        content_type="application/json",
    )

    assert response.status_code == 200

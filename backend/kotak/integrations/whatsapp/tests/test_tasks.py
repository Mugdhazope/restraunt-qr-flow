# ruff: noqa: E501, I001, S105
from __future__ import annotations

from unittest.mock import patch

import pytest

from kotak.customers.models import Customer
from kotak.customers.models import Visit
from kotak.integrations.whatsapp.tasks import send_feedback_message
from kotak.restaurants.models import Restaurant




@pytest.fixture(autouse=True)
def _whatsapp_test_settings(settings):
    settings.WHATSAPP_ACCESS_TOKEN = "test-token"
    settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"

@pytest.mark.django_db
def test_send_feedback_message_sends_prompt_for_visit():
    restaurant = Restaurant.objects.create(name="R1", slug="r1")
    customer = Customer.objects.create(restaurant=restaurant, name="A", phone="+919900000040")
    visit = Visit.objects.create(customer=customer, restaurant=restaurant)

    with patch("kotak.integrations.whatsapp.tasks.WhatsAppService.send_text") as mocked_send:
        send_feedback_message(visit.id)

    mocked_send.assert_called_once_with(
        phone="+919900000040",
        message=(
            "Hey! How was your experience?\n"
            "Reply with a rating (1–5) ⭐"
        ),
    )


@pytest.mark.django_db
def test_send_feedback_message_missing_visit_no_crash():
    with patch("kotak.integrations.whatsapp.tasks.WhatsAppService.send_text") as mocked_send:
        send_feedback_message(999999)

    mocked_send.assert_not_called()

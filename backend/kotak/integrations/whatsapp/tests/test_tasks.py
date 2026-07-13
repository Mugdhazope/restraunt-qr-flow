# ruff: noqa: E501, I001, S105
from __future__ import annotations

from unittest.mock import MagicMock
from unittest.mock import patch

import pytest

from kotak.customers.models import Customer
from kotak.customers.models import Visit
from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError
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

    with patch(
        "kotak.integrations.whatsapp.tasks.whatsapp_client_for_restaurant",
    ) as mock_client_for_r:
        mock_client_for_r.return_value = MagicMock()
        with patch("kotak.integrations.whatsapp.tasks.WhatsAppService.send_text") as mocked_send:
            send_feedback_message(visit.id)

        mock_client_for_r.assert_called_once_with(restaurant)

    mocked_send.assert_called_once_with(
        phone="+919900000040",
        message=(
            "Hey! How was your experience at R1?\n"
            "Reply with a rating (1-5) ⭐"
        ),
    )


@pytest.mark.django_db
def test_send_feedback_message_missing_visit_no_crash():
    with patch("kotak.integrations.whatsapp.tasks.WhatsAppService.send_text") as mocked_send:
        send_feedback_message(999999)

    mocked_send.assert_not_called()


@pytest.mark.django_db
def test_send_feedback_message_prefers_session_text_when_allowed():
    restaurant = Restaurant.objects.create(
        name="R1",
        slug="r1-template",
        whatsapp_feedback_template_name="feedback_message",
        whatsapp_feedback_template_language="en",
    )
    customer = Customer.objects.create(restaurant=restaurant, name="A", phone="+919900000041")
    visit = Visit.objects.create(customer=customer, restaurant=restaurant)

    with patch(
        "kotak.integrations.whatsapp.tasks.whatsapp_client_for_restaurant",
    ) as mock_client_for_r:
        mock_client_for_r.return_value = MagicMock()
        with (
            patch("kotak.integrations.whatsapp.tasks.WhatsAppService.send_template") as mocked_tpl,
            patch("kotak.integrations.whatsapp.tasks.WhatsAppService.send_text") as mocked_send_text,
        ):
            send_feedback_message(visit.id)

        mock_client_for_r.assert_called_once_with(restaurant)

    mocked_send_text.assert_called_once_with(
        phone="+919900000041",
        message=(
            "Hey! How was your experience at R1?\n"
            "Reply with a rating (1-5) ⭐"
        ),
    )
    mocked_tpl.assert_not_called()


@pytest.mark.django_db
def test_send_feedback_message_falls_back_to_template_after_24h_block():
    restaurant = Restaurant.objects.create(
        name="R1",
        slug="r1-fallback",
        whatsapp_feedback_template_name="feedback_message",
        whatsapp_feedback_template_language="en",
    )
    customer = Customer.objects.create(restaurant=restaurant, name="A", phone="+919900000042")
    visit = Visit.objects.create(customer=customer, restaurant=restaurant)

    with patch(
        "kotak.integrations.whatsapp.tasks.whatsapp_client_for_restaurant",
    ) as mock_client_for_r:
        mock_client_for_r.return_value = MagicMock()
        with (
            patch(
                "kotak.integrations.whatsapp.tasks.WhatsAppService.send_template",
                return_value={"messages": [{"id": "x"}]},
            ) as mocked_tpl,
            patch(
                "kotak.integrations.whatsapp.tasks.WhatsAppService.send_text",
                side_effect=WhatsAppAPIError("outside window", meta_code=131047),
            ) as mocked_send_text,
        ):
            send_feedback_message(visit.id)

        mock_client_for_r.assert_called_once_with(restaurant)

    mocked_send_text.assert_called_once()
    mocked_tpl.assert_called_once_with(
        phone="+919900000042",
        template_name="feedback_message",
        language_code="en",
        body_parameters=["your experience at R1"],
    )


@pytest.mark.django_db
def test_send_feedback_message_no_template_config_does_not_retry_template():
    restaurant = Restaurant.objects.create(name="R1", slug="r1-no-template")
    customer = Customer.objects.create(restaurant=restaurant, name="A", phone="+919900000043")
    visit = Visit.objects.create(customer=customer, restaurant=restaurant)

    with patch(
        "kotak.integrations.whatsapp.tasks.whatsapp_client_for_restaurant",
    ) as mock_client_for_r:
        mock_client_for_r.return_value = MagicMock()
        with (
            patch(
                "kotak.integrations.whatsapp.tasks.WhatsAppService.send_text",
                side_effect=WhatsAppAPIError("outside window", meta_code=131047),
            ) as mocked_send_text,
            patch("kotak.integrations.whatsapp.tasks.WhatsAppService.send_template") as mocked_tpl,
        ):
            send_feedback_message(visit.id)

        mock_client_for_r.assert_called_once_with(restaurant)

    mocked_send_text.assert_called_once()
    mocked_tpl.assert_not_called()

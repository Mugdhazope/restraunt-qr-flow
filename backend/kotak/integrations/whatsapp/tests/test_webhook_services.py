# ruff: noqa: I001, COM812, E501, F841, PLR2004
from __future__ import annotations

import pytest
from django.test import override_settings

from kotak.customers.models import Customer
from kotak.feedback.models import Feedback
from kotak.restaurants.models import Restaurant
from kotak.integrations.whatsapp.parsers import ParsedWhatsAppMessage
from kotak.integrations.whatsapp.webhook_services import WhatsAppWebhookService


class DummyWhatsAppService:
    def __init__(self):
        self.messages: list[tuple[str, str]] = []

    def send_text(self, phone: str, message: str) -> dict:
        self.messages.append((phone, message))
        return {"ok": True}


@pytest.mark.django_db
class TestWhatsAppWebhookService:
    def test_non_numeric_without_open_feedback_is_ignored(self):
        service = WhatsAppWebhookService(whatsapp_service=DummyWhatsAppService())
        restaurant = Restaurant.objects.create(name="R1", slug="r1", whatsapp_phone_number_id="1001")
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        action = service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="hello",
                phone_number_id="1001",
            )
        )

        assert action == "ignored_non_numeric"
        assert Feedback.objects.count() == 0

    def test_out_of_range_digit_is_ignored(self):
        service = WhatsAppWebhookService(whatsapp_service=DummyWhatsAppService())
        restaurant = Restaurant.objects.create(name="R1", slug="r1", whatsapp_phone_number_id="1001")
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        action = service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="7",
                phone_number_id="1001",
            )
        )

        assert action == "ignored_out_of_range"
        assert Feedback.objects.count() == 0

    def test_low_rating_records_incomplete_and_sends_comment_prompt_only(self):
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(name="R1", slug="r1", whatsapp_phone_number_id="1001")
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        action = service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="2",
                phone_number_id="1001",
            )
        )

        assert action == "rating_recorded"
        feedback = Feedback.objects.get()
        assert feedback.rating == 2
        assert feedback.message == ""
        assert feedback.is_complete is False
        assert feedback.sentiment == "negative"
        assert len(dummy.messages) == 1
        assert "Thanks!" in dummy.messages[0][1]
        assert "experience" in dummy.messages[0][1]

    def test_high_rating_then_comment_sends_google_link(self):
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(
            name="R1",
            slug="r1",
            whatsapp_phone_number_id="1001",
            google_review_link="https://g.page/review/test",
        )
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="5",
                phone_number_id="1001",
            )
        )
        assert len(dummy.messages) == 1
        dummy.messages.clear()

        action = service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="Pizza was amazing",
                phone_number_id="1001",
            )
        )

        assert action == "comment_completed_google"
        feedback = Feedback.objects.get()
        assert feedback.rating == 5
        assert feedback.message == "Pizza was amazing"
        assert feedback.is_complete is True
        assert len(dummy.messages) == 1
        assert "Awesome!" in dummy.messages[0][1]
        assert "https://g.page/review/test" in dummy.messages[0][1]

    def test_customer_matched_by_digits_only_when_db_phone_has_no_plus(self):
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(
            name="R1",
            slug="r1",
            whatsapp_phone_number_id="1001",
            google_review_link="https://g.page/review/test",
        )
        Customer.objects.create(name="A", phone="919812345678", restaurant=restaurant)

        service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="5",
                phone_number_id="1001",
            )
        )
        dummy.messages.clear()
        service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="great",
                phone_number_id="1001",
            )
        )

        assert Feedback.objects.count() == 1
        assert len(dummy.messages) == 1
        assert "https://g.page/review/test" in dummy.messages[0][1]

    @override_settings(WHATSAPP_PHONE_NUMBER_ID="1021223604414193")
    def test_restaurant_fallback_when_waba_id_blank_and_matches_env(self):
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(
            name="Dough",
            slug="dough-joe",
            whatsapp_phone_number_id="",
            google_review_link="https://g.page/review/x",
        )
        Customer.objects.create(name="M", phone="+919812345678", restaurant=restaurant)

        service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="5",
                phone_number_id="1021223604414193",
            )
        )
        dummy.messages.clear()
        action = service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="ok",
                phone_number_id="1021223604414193",
            )
        )

        assert action == "comment_completed_google"
        assert Feedback.objects.get().rating == 5
        assert len(dummy.messages) == 1

    @override_settings(DEFAULT_GOOGLE_REVIEW_LINK="")
    def test_high_rating_comment_skips_google_when_no_link_configured(self):
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(
            name="R1",
            slug="r1",
            whatsapp_phone_number_id="1001",
            google_review_link="",
        )
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="5", phone_number_id="1001")
        )
        dummy.messages.clear()
        action = service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="nice", phone_number_id="1001")
        )

        assert action == "comment_completed_google"
        assert len(dummy.messages) == 0

    @override_settings(DEFAULT_GOOGLE_REVIEW_LINK="https://maps.example.com/review")
    def test_google_link_uses_default_when_restaurant_blank(self):
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(
            name="R1",
            slug="r1",
            whatsapp_phone_number_id="1001",
            google_review_link="",
        )
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="5", phone_number_id="1001")
        )
        dummy.messages.clear()
        service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="yum", phone_number_id="1001")
        )

        assert len(dummy.messages) == 1
        assert "https://maps.example.com/review" in dummy.messages[0][1]

    def test_missing_customer_is_ignored(self):
        service = WhatsAppWebhookService(whatsapp_service=DummyWhatsAppService())
        Restaurant.objects.create(name="R1", slug="r1", whatsapp_phone_number_id="1001")

        action = service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="5",
                phone_number_id="1001",
            )
        )

        assert action == "ignored_no_customer"
        assert Feedback.objects.count() == 0

    def test_low_rating_comment_completes_without_google_message(self):
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(
            name="R1",
            slug="r1",
            whatsapp_phone_number_id="1001",
            google_review_link="https://g.page/review/test",
        )
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="3", phone_number_id="1001")
        )
        dummy.messages.clear()
        action = service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="ok", phone_number_id="1001")
        )

        assert action == "comment_completed"
        assert len(dummy.messages) == 0
        assert Feedback.objects.get().is_complete is True

    @override_settings(WHATSAPP_PHONE_NUMBER_ID="1001")
    def test_finds_customer_when_env_waba_matches_and_multiple_restaurants_blank_id(self):
        """Dev setups often have several restaurants with empty whatsapp_phone_number_id."""
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        Restaurant.objects.create(name="Other", slug="other", whatsapp_phone_number_id="")
        r_menu = Restaurant.objects.create(name="Menu", slug="menu", whatsapp_phone_number_id="")
        Customer.objects.create(name="A", phone="+919812345678", restaurant=r_menu)

        action = service.process_inbound_message(
            ParsedWhatsAppMessage(
                phone="+919812345678",
                message="5",
                phone_number_id="1001",
            )
        )

        assert action == "rating_recorded"
        fb = Feedback.objects.get()
        assert fb.restaurant_id == r_menu.id
        assert fb.is_complete is False
        assert len(dummy.messages) == 1

    def test_duplicate_rating_ignored_while_open_feedback_exists_as_digit_comment(self):
        """Second '5' while awaiting comment is treated as the comment text (spec)."""
        dummy = DummyWhatsAppService()
        service = WhatsAppWebhookService(whatsapp_service=dummy)
        restaurant = Restaurant.objects.create(
            name="R1",
            slug="r1",
            whatsapp_phone_number_id="1001",
            google_review_link="https://g.page/x",
        )
        Customer.objects.create(name="A", phone="+919812345678", restaurant=restaurant)

        service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="5", phone_number_id="1001")
        )
        dummy.messages.clear()
        service.process_inbound_message(
            ParsedWhatsAppMessage(phone="+919812345678", message="5", phone_number_id="1001")
        )

        fb = Feedback.objects.get()
        assert fb.message == "5"
        assert fb.is_complete is True
        assert len(dummy.messages) == 1

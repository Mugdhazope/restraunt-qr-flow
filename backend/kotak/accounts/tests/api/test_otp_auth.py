# ruff: noqa: E501, I001, S105
from __future__ import annotations

from datetime import timedelta
from http import HTTPStatus
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from kotak.accounts.models import OTP
from kotak.customers.models import Customer
from kotak.customers.models import Visit
from kotak.restaurants.models import Restaurant




@pytest.fixture(autouse=True)
def _whatsapp_test_settings(settings):
    settings.WHATSAPP_ACCESS_TOKEN = "test-token"
    settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"

@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def restaurant(db) -> Restaurant:
    return Restaurant.objects.create(name="Dough & Joe", slug="dough-joe")


@pytest.mark.django_db
def test_send_otp_success(api_client: APIClient, restaurant: Restaurant):
    with patch("kotak.accounts.services.WhatsAppService.send_otp", return_value=None):
        response = api_client.post(
            "/api/auth/send-otp/",
            {"restaurant_slug": restaurant.slug, "phone": "+919900000001"},
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data.get("existing_user") is False
    assert OTP.objects.filter(phone="+919900000001").exists()
    assert Visit.objects.count() == 0


@pytest.mark.django_db
def test_send_otp_existing_customer_returns_jwt_and_schedules_feedback_immediately(
    api_client: APIClient, restaurant: Restaurant, settings
):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 90
    customer = Customer.objects.create(restaurant=restaurant, phone="+919900000040", name="Returner")

    with patch("kotak.accounts.services.WhatsAppService.send_otp") as mock_send:
        with patch("kotak.accounts.api.views.send_feedback_message.apply_async") as mocked_apply:
            response = api_client.post(
                "/api/auth/send-otp/",
                {"restaurant_slug": restaurant.slug, "phone": "+919900000040"},
                format="json",
            )

    mock_send.assert_not_called()
    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data["existing_user"] is True
    assert response.data["message"] == "Welcome back"
    assert response.data["customer_id"] == customer.id
    assert response.data["access"]
    assert response.data["refresh"]
    visit = Visit.objects.get(customer=customer, restaurant=restaurant)
    mocked_apply.assert_called_once_with(args=[visit.id], countdown=0)
    assert OTP.objects.filter(phone="+919900000040").count() == 0


@pytest.mark.django_db
def test_send_otp_existing_customer_schedules_feedback_even_after_recent_visit(
    api_client: APIClient, restaurant: Restaurant
):
    customer = Customer.objects.create(
        restaurant=restaurant,
        phone="+919900000041",
        name="Returner",
        total_visits=1,
        last_visit=timezone.now(),
    )
    Visit.objects.create(customer=customer, restaurant=restaurant)

    with patch("kotak.accounts.services.WhatsAppService.send_otp") as mock_send:
        with patch("kotak.accounts.api.views.send_feedback_message.apply_async") as mocked_apply:
            response = api_client.post(
                "/api/auth/send-otp/",
                {"restaurant_slug": restaurant.slug, "phone": "+919900000041"},
                format="json",
            )

    mock_send.assert_not_called()
    assert response.status_code == HTTPStatus.OK
    assert response.data["existing_user"] is True
    assert Visit.objects.filter(customer=customer).count() == 2
    customer.refresh_from_db()
    assert customer.total_visits == 2
    new_visit = Visit.objects.filter(customer=customer).order_by("-id").first()
    assert new_visit is not None
    mocked_apply.assert_called_once_with(args=[new_visit.id], countdown=0)


@pytest.mark.django_db
def test_send_otp_invalid_phone(api_client: APIClient, restaurant: Restaurant):
    response = api_client.post(
        "/api/auth/send-otp/",
        {"restaurant_slug": restaurant.slug, "phone": "9900000001"},
        format="json",
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "phone" in response.data


@pytest.mark.django_db
def test_send_otp_throttled(api_client: APIClient, restaurant: Restaurant):
    with patch("kotak.accounts.services.WhatsAppService.send_otp", return_value=None):
        for _ in range(3):
            api_client.post(
                "/api/auth/send-otp/",
                {"restaurant_slug": restaurant.slug, "phone": "+919900000002"},
                format="json",
            )

        response = api_client.post(
            "/api/auth/send-otp/",
            {"restaurant_slug": restaurant.slug, "phone": "+919900000002"},
            format="json",
        )

    assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS


@pytest.mark.django_db
def test_verify_otp_success_returns_jwt_and_customer(api_client: APIClient, restaurant: Restaurant):
    OTP.objects.create(phone="+919900000003", code="112233", is_verified=False)

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": "+919900000003",
                "otp": "112233",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data["customer_id"]
    assert response.data["access"]
    assert response.data["refresh"]
    assert Customer.objects.filter(id=response.data["customer_id"], restaurant=restaurant).exists()


@pytest.mark.django_db
def test_verify_otp_creates_visit_and_schedules_feedback_task(api_client: APIClient, restaurant: Restaurant, settings):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 90
    OTP.objects.create(phone="+919900000030", code="112233", is_verified=False)

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async") as mocked_apply:
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": "+919900000030",
                "otp": "112233",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    customer = Customer.objects.get(id=response.data["customer_id"])
    visit = Visit.objects.get(customer=customer, restaurant=restaurant)
    mocked_apply.assert_called_once_with(args=[visit.id], countdown=90)


@pytest.mark.django_db
def test_verify_otp_schedules_feedback_even_when_prior_visit_exists(
    api_client: APIClient, restaurant: Restaurant, settings
):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 90
    customer = Customer.objects.create(
        restaurant=restaurant,
        phone="+919900000031",
        name="Guest",
        total_visits=1,
        last_visit=timezone.now(),
    )
    Visit.objects.create(customer=customer, restaurant=restaurant)
    OTP.objects.create(phone="+919900000031", code="112233", is_verified=False)

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async") as mocked_apply:
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": "+919900000031",
                "otp": "112233",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert Visit.objects.filter(customer=customer).count() == 2
    customer.refresh_from_db()
    assert customer.total_visits == 2
    new_visit = Visit.objects.filter(customer=customer).order_by("-id").first()
    assert new_visit is not None
    mocked_apply.assert_called_once_with(args=[new_visit.id], countdown=90)


@pytest.mark.django_db
def test_verify_otp_invalid_code(api_client: APIClient, restaurant: Restaurant):
    OTP.objects.create(phone="+919900000004", code="112233", is_verified=False)

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": "+919900000004",
                "otp": "999999",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.BAD_REQUEST


@pytest.mark.django_db
def test_verify_otp_expired(api_client: APIClient, restaurant: Restaurant):
    otp = OTP.objects.create(phone="+919900000005", code="112233", is_verified=False)
    OTP.objects.filter(id=otp.id).update(created_at=timezone.now() - timedelta(minutes=10))

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": "+919900000005",
                "otp": "112233",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.BAD_REQUEST


@pytest.mark.django_db
def test_verify_otp_wrong_restaurant_slug(api_client: APIClient):
    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": "unknown-restaurant",
                "phone": "+919900000006",
                "otp": "112233",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "restaurant_slug" in response.data

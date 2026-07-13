# ruff: noqa: E501, I001, S105
from __future__ import annotations

from datetime import timedelta
from http import HTTPStatus
from unittest.mock import patch

import pytest

# WA_DISABLED: OTP HTTP routes commented in accounts/api/urls.py — skip OTP endpoint tests.
_OTP_ROUTE_SKIP = pytest.mark.skip(reason="WA_DISABLED: OTP routes commented out")

from django.utils import timezone
from rest_framework.test import APIClient

from kotak.accounts.models import OTP
from kotak.customers.models import Customer
from kotak.customers.models import CustomerTag
from kotak.customers.models import Visit
from kotak.integrations.sms.exceptions import SMSAPIError
from kotak.restaurants.models import Restaurant




@pytest.fixture(autouse=True)
def _sms_test_settings(settings):
    settings.SMS_API_KEY = "test-sms-key"
    settings.SMS_SENDER_ID = "DOUGHJ"
    settings.SMS_TEMPLATE_ID = "tmpl-1"

@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def restaurant(db) -> Restaurant:
    return Restaurant.objects.create(name="Dough & Joe", slug="dough-joe")


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_send_otp_success(api_client: APIClient, restaurant: Restaurant):
    with patch("kotak.accounts.services.SMSService.send_otp", return_value=None):
        response = api_client.post(
            "/api/auth/send-otp/",
            {"restaurant_slug": restaurant.slug, "phone": "+919900000001"},
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data.get("existing_user") is False
    assert response.data.get("delivery_channel") == "sms"
    assert OTP.objects.filter(phone="+919900000001", restaurant=restaurant).exists()
    assert Visit.objects.count() == 0


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_send_otp_calls_sms_provider(api_client: APIClient, restaurant: Restaurant):
    with patch(
        "kotak.accounts.services.SMSService.send_otp",
        return_value={"type": "success"},
    ) as mock_sms:
        response = api_client.post(
            "/api/auth/send-otp/",
            {"restaurant_slug": restaurant.slug, "phone": "+919900000005"},
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    mock_sms.assert_called_once()
    call_kw = mock_sms.call_args.kwargs
    assert call_kw["phone"] == "+919900000005"
    assert len(call_kw["otp_code"]) == 6


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_send_otp_falls_back_to_whatsapp_when_sms_fails(
    api_client: APIClient,
    restaurant: Restaurant,
    settings,
):
    settings.WHATSAPP_ACCESS_TOKEN = "test-wa-token"  # noqa: S105
    settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
    restaurant.whatsapp_otp_template_name = "login_otp"
    restaurant.save(update_fields=["whatsapp_otp_template_name"])
    with (
        patch(
            "kotak.accounts.services.SMSService.send_otp",
            side_effect=SMSAPIError("provider down"),
        ),
        patch("kotak.accounts.services.WhatsAppService.send_otp", return_value={}) as mock_wa,
    ):
        response = api_client.post(
            "/api/auth/send-otp/",
            {"restaurant_slug": restaurant.slug, "phone": "+919900000099"},
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data.get("delivery_channel") == "whatsapp"
    mock_wa.assert_called_once()


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_send_otp_existing_customer_returns_jwt_and_schedules_feedback_immediately(
    api_client: APIClient, restaurant: Restaurant, settings
):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 90
    customer = Customer.objects.create(
        restaurant=restaurant,
        phone="+919900000040",
        name="Returner",
        phone_verified=True,
    )

    with patch("kotak.accounts.services.SMSService.send_otp") as mock_send:
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
    assert response.data["total_visits"] == 1
    assert response.data["access"]
    assert response.data["refresh"]
    visit = Visit.objects.get(customer=customer, restaurant=restaurant)
    mocked_apply.assert_not_called()  # WA_DISABLED
    assert OTP.objects.filter(phone="+919900000040").count() == 0


@_OTP_ROUTE_SKIP
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
        phone_verified=True,
    )
    Visit.objects.create(customer=customer, restaurant=restaurant)

    with patch("kotak.accounts.services.SMSService.send_otp") as mock_send:
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
    mocked_apply.assert_not_called()  # WA_DISABLED


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_send_otp_invalid_phone(api_client: APIClient, restaurant: Restaurant):
    response = api_client.post(
        "/api/auth/send-otp/",
        {"restaurant_slug": restaurant.slug, "phone": "9900000001"},
        format="json",
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "phone" in response.data


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_send_otp_throttled(api_client: APIClient, restaurant: Restaurant):
    with patch("kotak.accounts.services.SMSService.send_otp", return_value=None):
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


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_verify_otp_success_returns_jwt_and_customer(api_client: APIClient, restaurant: Restaurant):
    OTP.objects.create(
        restaurant=restaurant,
        phone="+919900000003",
        code="112233",
        is_verified=False,
        is_used=False,
        expires_at=timezone.now() + timedelta(minutes=5),
    )

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


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_verify_otp_accepts_phone_with_spaces(api_client: APIClient, restaurant: Restaurant):
    OTP.objects.create(
        restaurant=restaurant,
        phone="+919900000099",
        code="554433",
        is_verified=False,
        is_used=False,
        expires_at=timezone.now() + timedelta(minutes=5),
    )

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": restaurant.slug,
                    "phone": "+91 99000 00099",
                "otp": "554433",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data["success"] is True
    assert response.data["customer_id"]
    assert response.data["access"]
    assert response.data["refresh"]
    assert Customer.objects.filter(id=response.data["customer_id"], restaurant=restaurant).exists()


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_verify_otp_creates_visit_and_schedules_feedback_task(api_client: APIClient, restaurant: Restaurant, settings):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 90
    OTP.objects.create(
        restaurant=restaurant,
        phone="+919900000030",
        code="112233",
        is_verified=False,
        is_used=False,
        expires_at=timezone.now() + timedelta(minutes=5),
    )

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
    mocked_apply.assert_not_called()  # WA_DISABLED


@_OTP_ROUTE_SKIP
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
    OTP.objects.create(
        restaurant=restaurant,
        phone="+919900000031",
        code="112233",
        is_verified=False,
        is_used=False,
        expires_at=timezone.now() + timedelta(minutes=5),
    )

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
    assert response.data["total_visits"] == 2
    new_visit = Visit.objects.filter(customer=customer).order_by("-id").first()
    assert new_visit is not None
    mocked_apply.assert_not_called()  # WA_DISABLED


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_verify_otp_invalid_code(api_client: APIClient, restaurant: Restaurant):
    OTP.objects.create(
        restaurant=restaurant,
        phone="+919900000004",
        code="112233",
        is_verified=False,
        is_used=False,
        expires_at=timezone.now() + timedelta(minutes=5),
    )

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


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_verify_otp_expired(api_client: APIClient, restaurant: Restaurant):
    OTP.objects.create(
        restaurant=restaurant,
        phone="+919900000005",
        code="112233",
        is_verified=False,
        is_used=False,
        expires_at=timezone.now() - timedelta(minutes=1),
    )

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


@_OTP_ROUTE_SKIP
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


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_send_otp_existing_unverified_user_still_gets_sms(api_client: APIClient, restaurant: Restaurant):
    customer = Customer.objects.create(
        restaurant=restaurant,
        phone="+919900000055",
        name="Pending",
        phone_verified=False,
    )
    with patch("kotak.accounts.services.SMSService.send_otp", return_value={"type": "success"}) as mock_send:
        response = api_client.post(
            "/api/auth/send-otp/",
            {"restaurant_slug": restaurant.slug, "phone": customer.phone, "name": customer.name},
            format="json",
        )
    assert response.status_code == HTTPStatus.OK
    assert response.data["existing_user"] is False
    mock_send.assert_called_once()


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_verify_otp_marks_customer_phone_verified(api_client: APIClient, restaurant: Restaurant):
    customer = Customer.objects.create(
        restaurant=restaurant,
        phone="+919900000056",
        name="Pending",
        phone_verified=False,
    )
    OTP.objects.create(
        restaurant=restaurant,
        phone=customer.phone,
        code="121212",
        is_verified=False,
        is_used=False,
        expires_at=timezone.now() + timedelta(minutes=5),
    )
    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        response = api_client.post(
            "/api/auth/verify-otp/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": customer.phone,
                "otp": "121212",
                "name": customer.name,
            },
            format="json",
        )
    assert response.status_code == HTTPStatus.OK
    customer.refresh_from_db()
    assert customer.phone_verified is True
    assert customer.otp_verified_at is not None


@pytest.mark.django_db
def test_check_in_creates_customer_visit_and_jwt(api_client: APIClient, restaurant: Restaurant, settings):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 90
    with patch("kotak.accounts.api.views.send_feedback_message.apply_async") as mocked_apply:
        response = api_client.post(
            "/api/auth/check-in/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": "+919900000080",
                "name": "Walk In",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data["existing_user"] is False
    assert response.data["customer_id"]
    assert response.data["access"]
    assert response.data["refresh"]
    assert response.data["total_visits"] == 1
    customer = Customer.objects.get(id=response.data["customer_id"])
    assert customer.phone_verified is True
    assert customer.total_visits == 1
    visit = Visit.objects.get(customer=customer, restaurant=restaurant)
    mocked_apply.assert_not_called()  # WA_DISABLED


@pytest.mark.django_db
def test_check_in_returning_verified_uses_env_feedback_delay(
    api_client: APIClient, restaurant: Restaurant, settings
):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 90
    customer = Customer.objects.create(
        restaurant=restaurant,
        phone="+919900000081",
        name="Regular",
        phone_verified=True,
    )

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async") as mocked_apply:
        response = api_client.post(
            "/api/auth/check-in/",
            {
                "restaurant_slug": restaurant.slug,
                "phone": "+919900000081",
                "name": "Regular",
            },
            format="json",
        )

    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    assert response.data["existing_user"] is True
    assert response.data["total_visits"] == 1
    visit = Visit.objects.filter(customer=customer, restaurant=restaurant).order_by("-id").first()
    assert visit is not None
    mocked_apply.assert_not_called()  # WA_DISABLED


@pytest.mark.django_db
def test_check_in_twice_bumps_visits_and_clears_first_time_tag(
    api_client: APIClient, restaurant: Restaurant, settings
):
    settings.FEEDBACK_PROMPT_DELAY_SECONDS = 60
    phone = "+919900000082"
    payload = {
        "restaurant_slug": restaurant.slug,
        "phone": phone,
        "name": "Repeat",
    }
    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        r1 = api_client.post("/api/auth/check-in/", payload, format="json")
    assert r1.status_code == HTTPStatus.OK
    customer = Customer.objects.get(phone=phone, restaurant=restaurant)
    assert customer.total_visits == 1
    assert customer.tag == CustomerTag.FIRST_TIME

    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        r2 = api_client.post("/api/auth/check-in/", payload, format="json")
    assert r2.status_code == HTTPStatus.OK
    assert r2.data["total_visits"] == 2
    customer.refresh_from_db()
    assert customer.total_visits == 2
    assert customer.tag == CustomerTag.NEUTRAL
    assert Visit.objects.filter(customer=customer, restaurant=restaurant).count() == 2


@pytest.mark.django_db
def test_check_in_throttled(api_client: APIClient, restaurant: Restaurant, settings):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {"check_in": "2/day"},
    }
    # Re-bind throttle rates after settings override (DRF caches rates on the class).
    from kotak.accounts.api.views import CheckInAnonThrottle

    CheckInAnonThrottle.THROTTLE_RATES = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]
    payload = {
        "restaurant_slug": restaurant.slug,
        "phone": "+919900000083",
        "name": "Spam",
    }
    with patch("kotak.accounts.api.views.send_feedback_message.apply_async"):
        assert api_client.post("/api/auth/check-in/", payload, format="json").status_code == HTTPStatus.OK
        payload["phone"] = "+919900000084"
        assert api_client.post("/api/auth/check-in/", payload, format="json").status_code == HTTPStatus.OK
        payload["phone"] = "+919900000085"
        response = api_client.post("/api/auth/check-in/", payload, format="json")
    assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS


@_OTP_ROUTE_SKIP
@pytest.mark.django_db
def test_resend_otp_endpoint(api_client: APIClient, restaurant: Restaurant):
    with patch("kotak.accounts.services.SMSService.send_otp", return_value={"type": "success"}) as mock_send:
        response = api_client.post(
            "/api/auth/resend-otp/",
            {"restaurant_slug": restaurant.slug, "phone": "+919900000057"},
            format="json",
        )
    assert response.status_code == HTTPStatus.OK
    assert response.data["success"] is True
    mock_send.assert_called_once()

from __future__ import annotations

from datetime import timedelta
from http import HTTPStatus
from unittest.mock import Mock
from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from kotak.campaigns.models import CampaignSend
from kotak.campaigns.tasks import send_campaign_whatsapp_task
from kotak.customers.models import Customer
from kotak.customers.models import CustomerTag
from kotak.customers.models import Visit
from kotak.feedback.models import Feedback
from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError
from kotak.restaurants.models import Restaurant
from kotak.users.tests.factories import UserFactory


@pytest.fixture
def restaurant(db) -> Restaurant:
    return Restaurant.objects.create(name="Test Cafe", slug="test-cafe")


@pytest.fixture
def other_restaurant(db) -> Restaurant:
    return Restaurant.objects.create(name="Other", slug="other-place")


@pytest.fixture
def staff_user(db):
    return UserFactory.create(is_staff=True)


@pytest.fixture
def staff_client(staff_user) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.fixture
def regular_client(user) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestDashboardAuthAndScope:
    def test_dashboard_requires_staff(self, regular_client, restaurant):
        url = reverse("api:dashboard-list")
        r = regular_client.get(url, {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.FORBIDDEN

    def test_dashboard_requires_restaurant_slug(self, staff_client):
        url = reverse("api:dashboard-list")
        r = staff_client.get(url)
        assert r.status_code == HTTPStatus.BAD_REQUEST

    def test_dashboard_unknown_restaurant_slug(self, staff_client):
        url = reverse("api:dashboard-list")
        r = staff_client.get(url, {"restaurant_slug": "nope"})
        assert r.status_code == HTTPStatus.BAD_REQUEST
        assert "restaurant_slug" in r.data


@pytest.mark.django_db
class TestDashboardSummary:
    def test_dashboard_counts_and_recent(self, staff_client, restaurant):
        c1 = Customer.objects.create(
            restaurant=restaurant,
            name="A",
            phone="+911",
            tag=CustomerTag.VIP,
        )
        Visit.objects.create(customer=c1, restaurant=restaurant)
        Feedback.objects.create(
            customer=c1,
            restaurant=restaurant,
            rating=5,
            message="ok",
        )
        Feedback.objects.create(
            customer=c1,
            restaurant=restaurant,
            rating=2,
            message="meh",
        )

        url = reverse("api:dashboard-list")
        r = staff_client.get(url, {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.OK
        assert r.data["total_customers"] == 1
        assert r.data["total_visits"] == 1
        assert r.data["total_feedback"] == 2  # noqa: PLR2004
        assert r.data["positive_feedback_percentage"] == 50.0  # noqa: PLR2004
        assert len(r.data["recent_feedback"]) == 2  # noqa: PLR2004

    def test_dashboard_positive_percentage_zero_when_no_feedback(
        self,
        staff_client,
        restaurant,
    ):
        url = reverse("api:dashboard-list")
        r = staff_client.get(url, {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.OK
        assert r.data["total_feedback"] == 0
        assert r.data["positive_feedback_percentage"] == 0.0


@pytest.mark.django_db
class TestCustomers:
    def test_list_search_and_tag_filter(self, staff_client, restaurant):
        Customer.objects.create(
            restaurant=restaurant,
            name="Asha",
            phone="+919800011122",
            tag=CustomerTag.VIP,
        )
        Customer.objects.create(
            restaurant=restaurant,
            name="Bob",
            phone="+919800033344",
            tag=CustomerTag.NEUTRAL,
        )
        url = reverse("api:customers-list")
        r = staff_client.get(
            url,
            {"restaurant_slug": restaurant.slug, "search": "Asha"},
        )
        assert r.status_code == HTTPStatus.OK
        assert r.data["count"] == 1
        r2 = staff_client.get(
            url,
            {"restaurant_slug": restaurant.slug, "tag": CustomerTag.VIP},
        )
        assert r2.status_code == HTTPStatus.OK
        assert r2.data["count"] == 1

    def test_customer_detail_not_other_restaurant(
        self,
        staff_client,
        restaurant,
        other_restaurant,
    ):
        c = Customer.objects.create(
            restaurant=other_restaurant,
            name="X",
            phone="+1",
        )
        url = reverse("api:customers-detail", kwargs={"pk": c.pk})
        r = staff_client.get(url, {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.NOT_FOUND

    def test_customer_patch_tag(self, staff_client, restaurant):
        c = Customer.objects.create(
            restaurant=restaurant,
            name="Y",
            phone="+919900011199",
            tag=CustomerTag.NEUTRAL,
        )
        url = reverse("api:customers-detail", kwargs={"pk": c.pk})
        r = staff_client.patch(
            f"{url}?restaurant_slug={restaurant.slug}",
            {"tag": CustomerTag.VIP},
            format="json",
        )
        assert r.status_code == HTTPStatus.OK
        assert r.data["tag"] == CustomerTag.VIP
        c.refresh_from_db()
        assert c.tag == CustomerTag.VIP


@pytest.mark.django_db
class TestFeedback:
    def test_rating_filters(self, staff_client, restaurant):
        c = Customer.objects.create(
            restaurant=restaurant,
            name="C",
            phone="+2",
        )
        Feedback.objects.create(customer=c, restaurant=restaurant, rating=5, message="")
        Feedback.objects.create(customer=c, restaurant=restaurant, rating=2, message="")

        url = reverse("api:feedback-list")
        hi = staff_client.get(
            url,
            {"restaurant_slug": restaurant.slug, "rating_min": 4},
        )
        assert hi.status_code == HTTPStatus.OK
        assert hi.data["count"] == 1
        lo = staff_client.get(
            url,
            {"restaurant_slug": restaurant.slug, "rating_max": 3},
        )
        assert lo.status_code == HTTPStatus.OK
        assert lo.data["count"] == 1


@pytest.mark.django_db
class TestCampaignSend:
    @pytest.fixture(autouse=True)
    def _celery_always_eager(self, settings):
        settings.CELERY_TASK_ALWAYS_EAGER = True

    def test_campaign_send_mocked_whatsapp(self, staff_client, restaurant, settings):
        settings.WHATSAPP_ACCESS_TOKEN = "test-token"  # noqa: S105
        settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
        Customer.objects.create(
            restaurant=restaurant,
            name="A",
            phone="+919811122233",
            tag=CustomerTag.VIP,
        )
        path = reverse("api:campaigns-send")
        url = f"{path}?restaurant_slug={restaurant.slug}"
        with patch(
            "kotak.integrations.whatsapp.client.WhatsAppClient.send_text_message",
            return_value={"ok": True},
        ):
            r = staff_client.post(
                url,
                {"message": "Hello", "target_type": "VIP"},
                format="json",
            )
        assert r.status_code == HTTPStatus.OK
        assert r.data["sent"] == 1
        assert r.data["failed"] == 0
        assert r.data["recipient_count"] == 1

    def test_campaign_send_uses_meta_template_when_configured(
        self,
        staff_client,
        restaurant,
        settings,
    ):
        settings.WHATSAPP_ACCESS_TOKEN = "test-token"  # noqa: S105
        settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
        restaurant.whatsapp_broadcast_template_name = "promo_body"
        restaurant.whatsapp_broadcast_template_language = "en_US"
        restaurant.save(
            update_fields=[
                "whatsapp_broadcast_template_name",
                "whatsapp_broadcast_template_language",
            ],
        )
        Customer.objects.create(
            restaurant=restaurant,
            name="A",
            phone="+919811122233",
            tag=CustomerTag.VIP,
        )
        path = reverse("api:campaigns-send")
        url = f"{path}?restaurant_slug={restaurant.slug}"
        with patch(
            "kotak.integrations.whatsapp.client.WhatsAppClient.send_template_message",
            return_value={"messages": [{"id": "x"}]},
        ) as mock_tpl:
            r = staff_client.post(
                url,
                {"message": "Hello weekend", "target_type": "VIP"},
                format="json",
            )
        assert r.status_code == HTTPStatus.OK
        assert r.data["sent"] == 1
        mock_tpl.assert_called_once()
        call_kw = mock_tpl.call_args.kwargs
        assert call_kw["template_name"] == "promo_body"
        assert call_kw["language_code"] == "en"
        assert call_kw["body_parameters"] == ["Hello weekend"]

    def test_campaign_send_returns_202_when_not_eager(
        self,
        staff_client,
        restaurant,
        settings,
    ):
        settings.CELERY_TASK_ALWAYS_EAGER = False
        settings.WHATSAPP_ACCESS_TOKEN = "test-token"  # noqa: S105
        settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
        Customer.objects.create(
            restaurant=restaurant,
            name="A",
            phone="+919811122233",
            tag=CustomerTag.VIP,
        )
        path = reverse("api:campaigns-send")
        url = f"{path}?restaurant_slug={restaurant.slug}"
        mock_result = Mock()
        mock_result.id = "task-id-xyz"
        with patch.object(
            send_campaign_whatsapp_task,
            "apply_async",
            return_value=mock_result,
        ):
            r = staff_client.post(
                url,
                {"message": "Hello", "target_type": "VIP"},
                format="json",
            )
        assert r.status_code == HTTPStatus.ACCEPTED
        assert r.data["queued"] is True
        assert r.data["task_id"] == "task-id-xyz"
        assert r.data["recipient_count"] == 1
        assert r.data["name"] == "WhatsApp campaign"

    def test_campaign_falls_back_to_template_after_24h_window_error(
        self,
        staff_client,
        restaurant,
        settings,
    ):
        settings.WHATSAPP_ACCESS_TOKEN = "test-token"  # noqa: S105
        settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
        restaurant.whatsapp_broadcast_template_name = "campaign_message"
        restaurant.whatsapp_broadcast_template_language = "en"
        restaurant.save(
            update_fields=[
                "whatsapp_broadcast_template_name",
                "whatsapp_broadcast_template_language",
            ],
        )
        Customer.objects.create(
            restaurant=restaurant,
            name="A",
            phone="+919811122233",
            tag=CustomerTag.VIP,
        )
        path = reverse("api:campaigns-send")
        url = f"{path}?restaurant_slug={restaurant.slug}"
        with (
            patch(
                "kotak.integrations.whatsapp.client.WhatsAppClient.send_text_message",
                side_effect=WhatsAppAPIError("outside window", meta_code=131047),
            ) as mock_text,
            patch(
                "kotak.integrations.whatsapp.client.WhatsAppClient.send_template_message",
                return_value={"messages": [{"id": "x"}]},
            ) as mock_tpl,
        ):
            r = staff_client.post(
                url,
                {"message": "Hello weekend", "target_type": "VIP"},
                format="json",
            )
        assert r.status_code == HTTPStatus.OK
        assert r.data["sent"] == 1
        assert r.data["failed"] == 0
        mock_text.assert_called_once()
        mock_tpl.assert_called_once()


@pytest.mark.django_db
class TestInactiveSegment:
    @pytest.fixture(autouse=True)
    def _celery_always_eager(self, settings):
        settings.CELERY_TASK_ALWAYS_EAGER = True

    def test_inactive_includes_old_last_visit(self, staff_client, restaurant, settings):
        settings.WHATSAPP_ACCESS_TOKEN = "test-token"  # noqa: S105
        settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
        settings.CRM_INACTIVE_VISIT_DAYS = 30
        old = timezone.now() - timedelta(days=60)
        Customer.objects.create(
            restaurant=restaurant,
            name="Old",
            phone="+99",
            last_visit=old,
            total_visits=3,
        )
        path = reverse("api:campaigns-send")
        url = f"{path}?restaurant_slug={restaurant.slug}"
        with patch(
            "kotak.integrations.whatsapp.client.WhatsAppClient.send_text_message",
            return_value={},
        ):
            r = staff_client.post(
                url,
                {"message": "We miss you", "target_type": "INACTIVE"},
                format="json",
            )
        assert r.status_code == HTTPStatus.OK
        assert r.data["recipient_count"] == 1


@pytest.mark.django_db
class TestTagCampaignSegments:
    @pytest.fixture(autouse=True)
    def _celery_always_eager(self, settings):
        settings.CELERY_TASK_ALWAYS_EAGER = True

    def test_neutral_segment(self, staff_client, restaurant, settings):
        settings.WHATSAPP_ACCESS_TOKEN = "test-token"  # noqa: S105
        settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
        Customer.objects.create(
            restaurant=restaurant,
            name="N1",
            phone="+919911100001",
            tag=CustomerTag.NEUTRAL,
        )
        Customer.objects.create(
            restaurant=restaurant,
            name="V1",
            phone="+919911100002",
            tag=CustomerTag.VIP,
        )
        path = reverse("api:campaigns-send")
        url = f"{path}?restaurant_slug={restaurant.slug}"
        with patch(
            "kotak.integrations.whatsapp.client.WhatsAppClient.send_text_message",
            return_value={},
        ):
            r = staff_client.post(
                url,
                {"message": "Hi", "target_type": "NEUTRAL"},
                format="json",
            )
        assert r.status_code == HTTPStatus.OK
        assert r.data["recipient_count"] == 1


@pytest.mark.django_db
class TestCampaignLifecycleAndAutomations:
    @pytest.fixture(autouse=True)
    def _celery_not_eager(self, settings):
        settings.CELERY_TASK_ALWAYS_EAGER = False

    def test_campaign_resend_and_soft_delete(self, staff_client, restaurant):
        row = CampaignSend.objects.create(
            restaurant=restaurant,
            name="Promo",
            target_type="ALL",
            message="Hello",
            recipient_count=0,
            sent=0,
            failed=0,
        )
        resend_url = reverse("api:campaigns-resend", kwargs={"pk": row.id})
        with patch.object(send_campaign_whatsapp_task, "apply_async", return_value=Mock(id="abc123")):
            resend = staff_client.post(
                f"{resend_url}?restaurant_slug={restaurant.slug}",
                {"scheduled_for": None},
                format="json",
            )
        assert resend.status_code == HTTPStatus.ACCEPTED
        delete_url = reverse("api:campaigns-detail", kwargs={"pk": row.id})
        deleted = staff_client.delete(f"{delete_url}?restaurant_slug={restaurant.slug}")
        assert deleted.status_code == HTTPStatus.NO_CONTENT
        listed = staff_client.get(reverse("api:campaigns-list"), {"restaurant_slug": restaurant.slug})
        assert listed.status_code == HTTPStatus.OK
        ids = [item["id"] for item in listed.data["results"]]
        assert row.id not in ids

    def test_automations_endpoint_defaults(self, staff_client, restaurant):
        url = reverse("api:automations-list")
        response = staff_client.get(url, {"restaurant_slug": restaurant.slug})
        assert response.status_code == HTTPStatus.OK
        triggers = {item["trigger_type"] for item in response.data["results"]}
        assert "positive_feedback" in triggers
        assert "no_visit_14_days" in triggers
        assert "third_visit_completed" in triggers

    def test_inactive_tag_segment(self, staff_client, restaurant, settings):
        settings.WHATSAPP_ACCESS_TOKEN = "test-token"  # noqa: S105
        settings.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id"
        Customer.objects.create(
            restaurant=restaurant,
            name="I1",
            phone="+919911100003",
            tag=CustomerTag.INACTIVE,
        )
        path = reverse("api:campaigns-send")
        url = f"{path}?restaurant_slug={restaurant.slug}"
        with patch(
            "kotak.integrations.whatsapp.client.WhatsAppClient.send_text_message",
            return_value={},
        ):
            r = staff_client.post(
                url,
                {"message": "Hi", "target_type": "INACTIVE_TAG"},
                format="json",
            )
        assert r.status_code == HTTPStatus.OK
        assert r.data["recipient_count"] == 1

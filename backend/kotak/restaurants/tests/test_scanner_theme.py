from __future__ import annotations

from http import HTTPStatus

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from kotak.restaurants.models import Restaurant
from kotak.users.tests.factories import UserFactory


@pytest.fixture
def restaurant(db) -> Restaurant:
    return Restaurant.objects.create(name="Theme Test", slug="theme-test")


@pytest.fixture
def staff_client(db):
    user = UserFactory.create(is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestScannerTheme:
    def test_public_menu_includes_scanner_theme(self, restaurant):
        restaurant.scanner_theme = {
            "background": "#e8f5e9",
            "tags": {"new": {"bg": "#00ff00", "text": "#000000", "emoji": "✨"}},
        }
        restaurant.save(update_fields=["scanner_theme"])
        client = APIClient()
        r = client.get(reverse("public-menu"), {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.OK
        assert r.data["restaurant"]["scanner_theme"]["background"] == "#e8f5e9"
        assert r.data["restaurant"]["scanner_theme"]["tags"]["new"]["emoji"] == "✨"

    def test_patch_scanner_theme(self, staff_client, restaurant):
        detail = reverse("api:restaurants-detail", kwargs={"slug": restaurant.slug})
        r = staff_client.patch(
            detail,
            {
                "scanner_theme": {
                    "background": "#abcdef",
                    "tags": {
                        "featured": {"bg": "#111111", "text": "#ffffff", "emoji": "⭐"},
                        "unknown_key": {"bg": "#000000"},
                    },
                },
            },
            format="json",
        )
        assert r.status_code == HTTPStatus.OK, r.data
        restaurant.refresh_from_db()
        assert restaurant.scanner_theme["background"] == "#abcdef"
        assert "featured" in restaurant.scanner_theme["tags"]
        assert "unknown_key" not in restaurant.scanner_theme.get("tags", {})

    def test_invalid_hex_rejected(self, staff_client, restaurant):
        detail = reverse("api:restaurants-detail", kwargs={"slug": restaurant.slug})
        r = staff_client.patch(
            detail,
            {"scanner_theme": {"background": "#ggg"}},
            format="json",
        )
        assert r.status_code == HTTPStatus.BAD_REQUEST

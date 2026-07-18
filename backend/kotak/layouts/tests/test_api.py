from __future__ import annotations

from http import HTTPStatus

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from kotak.layouts.defaults import default_layout_for
from kotak.layouts.models import PageKey
from kotak.layouts.models import PageLayout
from kotak.layouts.services import ensure_default_layouts
from kotak.layouts.validation import validate_layout_document
from kotak.restaurants.models import Restaurant
from kotak.users.tests.factories import UserFactory


@pytest.fixture
def restaurant(db) -> Restaurant:
    return Restaurant.objects.create(name="Layout Test", slug="layout-test")


@pytest.fixture
def staff_client(db):
    user = UserFactory.create(is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestLayoutValidation:
    def test_default_layouts_valid(self):
        for key, _ in PageKey.choices:
            doc = default_layout_for(key)
            cleaned = validate_layout_document(doc, page_key=key, strict=True)
            assert cleaned["page_key"] == key
            assert cleaned["root"]["type"] == "PageRoot"

    def test_unknown_type_rejected(self):
        doc = default_layout_for(PageKey.MENU)
        doc["root"]["children"] = [
            {
                "id": "bad",
                "type": "NotARealComponent",
                "visible": True,
                "locked": False,
                "props": {},
                "style": {},
                "frame": {"x": 0, "y": 0, "w": 100, "h": None},
            },
        ]
        with pytest.raises(Exception):
            validate_layout_document(doc, page_key=PageKey.MENU, strict=True)

    def test_frames_normalized(self):
        doc = default_layout_for(PageKey.WELCOME)
        child = doc["root"]["children"][0]
        child["frame"] = {"x": -80, "y": 10, "w": 200, "h": 40}
        cleaned = validate_layout_document(doc, page_key=PageKey.WELCOME, strict=True)
        frame = cleaned["root"]["children"][0]["frame"]
        assert frame["x"] == -50
        assert frame["w"] == 150
        assert frame["h"] == 40

    def test_menu_default_is_menubook(self):
        doc = default_layout_for(PageKey.MENU)
        assert doc["root"]["children"][0]["type"] == "MenuBook"
        assert doc["schema_version"] == 2

    def test_button_alias_normalized_to_cta(self):
        doc = default_layout_for(PageKey.WELCOME)
        doc["root"]["children"][3]["type"] = "Button"
        cleaned = validate_layout_document(doc, page_key=PageKey.WELCOME, strict=True)
        assert cleaned["root"]["children"][3]["type"] == "CTAButton"

    def test_transparent_background_type_allowed(self):
        doc = default_layout_for(PageKey.WELCOME)
        doc["root"]["props"] = {
            **(doc["root"].get("props") or {}),
            "backgroundType": "transparent",
            "overlayOpacity": 0.5,
        }
        cleaned = validate_layout_document(doc, page_key=PageKey.WELCOME, strict=True)
        assert cleaned["root"]["props"]["backgroundType"] == "transparent"


@pytest.mark.django_db
class TestLayoutAPI:
    def test_ensure_defaults(self, restaurant):
        created = ensure_default_layouts(restaurant)
        assert len(created) == 4
        assert PageLayout.objects.filter(restaurant=restaurant).count() == 4
        # idempotent
        assert ensure_default_layouts(restaurant) == []

    def test_public_layouts(self, restaurant):
        ensure_default_layouts(restaurant)
        client = APIClient()
        url = reverse("public-layouts", kwargs={"restaurant_slug": restaurant.slug})
        r = client.get(url)
        assert r.status_code == HTTPStatus.OK
        assert r.data["restaurant_slug"] == restaurant.slug
        assert len(r.data["pages"]) == 4
        keys = {p["page_key"] for p in r.data["pages"]}
        assert keys == {"welcome", "checked_in", "menu", "item_detail"}

    def test_public_layouts_skips_orphan_page_key(self, restaurant):
        """Legacy/unknown page_key must not 500 the public layouts endpoint."""
        ensure_default_layouts(restaurant)
        PageLayout.objects.create(
            restaurant=restaurant,
            page_key="category_view",
            version=1,
            schema_version=2,
            layout={
                "schema_version": 2,
                "page_key": "category_view",
                "root": {
                    "id": "root",
                    "type": "PageRoot",
                    "visible": True,
                    "locked": False,
                    "props": {},
                    "style": {},
                    "frame": {"x": 0, "y": 0, "w": 100, "h": None},
                    "children": [],
                },
            },
        )
        client = APIClient()
        url = reverse("public-layouts", kwargs={"restaurant_slug": restaurant.slug})
        r = client.get(url)
        assert r.status_code == HTTPStatus.OK, r.data
        keys = {p["page_key"] for p in r.data["pages"]}
        assert "category_view" not in keys
        assert keys == {"welcome", "checked_in", "menu", "item_detail"}

    def test_staff_get_and_put(self, staff_client, restaurant):
        ensure_default_layouts(restaurant)
        get_url = reverse("api:layouts-page")
        r = staff_client.get(get_url, {"restaurant_slug": restaurant.slug, "page_key": "menu"})
        assert r.status_code == HTTPStatus.OK, r.data
        assert r.data["page_key"] == "menu"
        version = r.data["version"]
        layout = r.data["layout"]
        child = layout["root"]["children"][0]
        child["frame"] = {**(child.get("frame") or {}), "x": 2, "y": 2, "w": 96, "h": 96}

        put = staff_client.put(
            get_url + f"?restaurant_slug={restaurant.slug}",
            {"page_key": "menu", "layout": layout, "expected_version": version},
            format="json",
        )
        assert put.status_code == HTTPStatus.OK, put.data
        assert put.data["version"] == version + 1
        assert put.data["layout"]["root"]["children"][0]["frame"]["x"] == 2

    def test_save_page_background_props(self, staff_client, restaurant):
        ensure_default_layouts(restaurant)
        get_url = reverse("api:layouts-page")
        r = staff_client.get(get_url, {"restaurant_slug": restaurant.slug, "page_key": "welcome"})
        assert r.status_code == HTTPStatus.OK, r.data
        version = r.data["version"]
        layout = r.data["layout"]
        layout["root"]["props"] = {
            **(layout["root"].get("props") or {}),
            "backgroundType": "gradient",
            "gradientFrom": "#112233",
            "gradientTo": "#445566",
            "gradientAngle": 135,
            "overlayColor": "#000000",
            "overlayOpacity": 0.25,
            "blur": 2,
            "brightness": 90,
        }
        put = staff_client.put(
            get_url + f"?restaurant_slug={restaurant.slug}",
            {"page_key": "welcome", "layout": layout, "expected_version": version},
            format="json",
        )
        assert put.status_code == HTTPStatus.OK, put.data
        props = put.data["layout"]["root"]["props"]
        assert props["backgroundType"] == "gradient"
        assert props["gradientFrom"] == "#112233"
        assert props["overlayOpacity"] == 0.25

        public = APIClient()
        pub = public.get(reverse("public-layouts", kwargs={"restaurant_slug": restaurant.slug}))
        assert pub.status_code == HTTPStatus.OK
        welcome = next(p for p in pub.data["pages"] if p["page_key"] == "welcome")
        assert welcome["layout"]["root"]["props"]["backgroundType"] == "gradient"

    def test_upload_layout_asset(self, staff_client, restaurant):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image
        from io import BytesIO

        buf = BytesIO()
        Image.new("RGB", (32, 32), color=(20, 40, 60)).save(buf, format="PNG")
        upload = SimpleUploadedFile("bg.png", buf.getvalue(), content_type="image/png")
        url = reverse("api:layouts-assets")
        r = staff_client.post(
            f"{url}?restaurant_slug={restaurant.slug}",
            {"image": upload},
            format="multipart",
        )
        assert r.status_code == HTTPStatus.CREATED, r.data
        assert "url" in r.data
        assert r.data["url"]
        from kotak.layouts.models import LayoutAsset

        assert LayoutAsset.objects.filter(restaurant=restaurant).count() == 1

    def test_version_conflict(self, staff_client, restaurant):
        ensure_default_layouts(restaurant)
        get_url = reverse("api:layouts-page")
        r = staff_client.get(get_url, {"restaurant_slug": restaurant.slug, "page_key": "menu"})
        layout = r.data["layout"]
        conflict = staff_client.put(
            get_url + f"?restaurant_slug={restaurant.slug}",
            {"page_key": "menu", "layout": layout, "expected_version": 999},
            format="json",
        )
        assert conflict.status_code == HTTPStatus.CONFLICT

    def test_reset(self, staff_client, restaurant):
        ensure_default_layouts(restaurant)
        url = reverse("api:layouts-reset")
        r = staff_client.post(url, {"restaurant_slug": restaurant.slug, "page_key": "welcome"})
        # query params
        r = staff_client.post(
            f"{url}?restaurant_slug={restaurant.slug}&page_key=welcome",
        )
        assert r.status_code == HTTPStatus.OK, r.data
        assert r.data["page_key"] == "welcome"

    def test_list_pages(self, staff_client, restaurant):
        url = reverse("api:layouts-pages")
        r = staff_client.get(url, {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.OK
        assert len(r.data) == 4

    def test_reject_unknown_component_on_write(self, staff_client, restaurant):
        ensure_default_layouts(restaurant)
        get_url = reverse("api:layouts-page")
        bad = {
            "schema_version": 1,
            "page_key": "menu",
            "root": {
                "id": "root",
                "type": "PageRoot",
                "visible": True,
                "locked": False,
                "props": {},
                "style": {},
                "children": [
                    {
                        "id": "x",
                        "type": "FakeWidget",
                        "visible": True,
                        "locked": False,
                        "props": {},
                        "style": {},
                    },
                ],
            },
        }
        put = staff_client.put(
            get_url + f"?restaurant_slug={restaurant.slug}",
            {"page_key": "menu", "layout": bad},
            format="json",
        )
        assert put.status_code == HTTPStatus.BAD_REQUEST

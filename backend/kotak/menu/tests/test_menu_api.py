from __future__ import annotations

import json
from http import HTTPStatus
from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from kotak.dashboard.api.serializers import MenuItemReadSerializer
from kotak.menu.images import MENU_ARTBOARD_PX
from kotak.menu.images import process_menu_upload
from kotak.menu.models import MenuCategory
from kotak.menu.models import MenuItem
from kotak.restaurants.models import Restaurant
from kotak.users.tests.factories import UserFactory


def _tiny_png_bytes() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (80, 60), color=(200, 100, 50)).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def restaurant(db) -> Restaurant:
    return Restaurant.objects.create(name="Menu Test", slug="menu-test")


@pytest.fixture
def staff_client(db):
    user = UserFactory.create(is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestMenuItemImageUrl:
    def test_read_serializer_absolute_url(self, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="Cat")
        item = MenuItem.objects.create(
            category=cat,
            name="Item",
            description="d",
            price="12.50",
        )
        png = SimpleUploadedFile(
            "t.png",
            _tiny_png_bytes(),
            content_type="image/png",
        )
        item.image.save("t.png", png, save=True)
        rf = RequestFactory()
        req = rf.get("/")
        data = MenuItemReadSerializer(item, context={"request": req}).data
        assert data["image_url"] is not None
        assert data["image_url"].startswith("http://testserver/media/")

    def test_read_serializer_null_without_image(self, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="Cat")
        item = MenuItem.objects.create(
            category=cat,
            name="Plain",
            description="",
            price="1.00",
        )
        rf = RequestFactory()
        req = rf.get("/")
        data = MenuItemReadSerializer(item, context={"request": req}).data
        assert data["image_url"] is None
        assert data["image_scale"] == 100


@pytest.mark.django_db
class TestMenuItemImageScale:
    def test_read_serializer_includes_image_scale(self, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="Cat")
        item = MenuItem.objects.create(
            category=cat,
            name="Scaled",
            description="",
            price="10.00",
            image_scale=125,
        )
        rf = RequestFactory()
        req = rf.get("/")
        data = MenuItemReadSerializer(item, context={"request": req}).data
        assert data["image_scale"] == 125

    def test_write_rejects_out_of_range(self, staff_client, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="Cat")
        url = f"{reverse('api:menu-items-list')}?restaurant_slug={restaurant.slug}"
        for bad in (49, 201):
            r = staff_client.post(
                url,
                {
                    "category": cat.id,
                    "name": f"Bad-{bad}",
                    "description": "",
                    "price": "1.00",
                    "image_scale": bad,
                },
                format="json",
            )
            assert r.status_code == HTTPStatus.BAD_REQUEST

    def test_write_accepts_valid_scale(self, staff_client, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="Cat")
        url = f"{reverse('api:menu-items-list')}?restaurant_slug={restaurant.slug}"
        r = staff_client.post(
            url,
            {
                "category": cat.id,
                "name": "OkScale",
                "description": "",
                "price": "1.00",
                "image_scale": 150,
            },
            format="json",
        )
        assert r.status_code == HTTPStatus.CREATED
        assert r.data["image_scale"] == 150
        assert MenuItem.objects.get(name="OkScale").image_scale == 150

    def test_public_menu_includes_image_scale(self, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="Food")
        MenuItem.objects.create(
            category=cat,
            name="Burger",
            description="",
            price="199.00",
            image_scale=175,
        )
        client = APIClient()
        r = client.get(reverse("public-menu"), {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.OK
        assert r.data["categories"][0]["items"][0]["image_scale"] == 175


@pytest.mark.django_db
class TestPublicMenuImageUrl:
    def test_public_menu_includes_image_url(self, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="Food")
        item = MenuItem.objects.create(
            category=cat,
            name="Burger",
            description="Nice",
            price="199.00",
        )
        item.image.save(
            "b.png",
            SimpleUploadedFile("b.png", _tiny_png_bytes(), content_type="image/png"),
            save=True,
        )
        client = APIClient()
        r = client.get(reverse("public-menu"), {"restaurant_slug": restaurant.slug})
        assert r.status_code == HTTPStatus.OK
        cats = r.data["categories"]
        assert len(cats) == 1
        items = cats[0]["items"]
        assert len(items) == 1
        assert items[0]["image_url"] is not None
        assert items[0]["image_url"].startswith("http://testserver/media/")

    def test_public_menu_slug_path(self, restaurant):
        cat = MenuCategory.objects.create(restaurant=restaurant, name="X")
        MenuItem.objects.create(category=cat, name="Y", description="", price="1.00")
        client = APIClient()
        slug_kw = {"restaurant_slug": restaurant.slug}
        r = client.get(reverse("public-menu-by-slug", kwargs=slug_kw))
        assert r.status_code == HTTPStatus.OK
        assert r.data["restaurant"]["slug"] == restaurant.slug


@pytest.mark.django_db
class TestMenuItemBulk:
    def test_bulk_creates_with_images(self, staff_client, restaurant):
        MenuCategory.objects.create(restaurant=restaurant, name="Pizzas")
        png = _tiny_png_bytes()
        f1 = SimpleUploadedFile("a.png", png, content_type="image/png")
        manifest = [
            {
                "category_name": "Pizzas",
                "name": "One",
                "description": "d1",
                "price": "100.00",
                "tag": "",
                "is_featured": False,
                "is_new": False,
                "is_jain": False,
            },
        ]
        url = f"{reverse('api:menu-items-bulk')}?restaurant_slug={restaurant.slug}"
        r = staff_client.post(
            url,
            data={"manifest": json.dumps(manifest), "images": f1},
            format="multipart",
        )
        assert r.status_code == HTTPStatus.OK
        results = r.data["results"]
        assert len(results) == 1
        assert results[0]["ok"] is True
        assert MenuItem.objects.get(category__name="Pizzas", name="One").image.name


def test_pad_to_square_output_size():
    rgba = process_menu_upload(_tiny_png_bytes())
    im = Image.open(BytesIO(rgba.read()))
    assert im.size == (MENU_ARTBOARD_PX, MENU_ARTBOARD_PX)
    assert im.mode == "RGBA"

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from kotak.layouts.models import PageKey
from kotak.layouts.models import PageLayout
from kotak.restaurants.models import MembershipRole
from kotak.restaurants.models import Restaurant
from kotak.restaurants.models import RestaurantMembership
from kotak.users.models import User


@pytest.mark.django_db
def test_bootstrap_qr_tenant_creates_restaurant_layouts_and_admin():
    call_command(
        "bootstrap_qr_tenant",
        slug="go-live-test",
        name="Go Live Café",
        staff_email="staff@example.com",
        staff_password="SecurePass123!",
        staff_username="golive",
    )

    restaurant = Restaurant.objects.get(slug="go-live-test")
    assert restaurant.name == "Go Live Café"
    assert PageLayout.objects.filter(restaurant=restaurant).count() == len(PageKey.choices)

    user = User.objects.get(username="golive")
    assert user.email == "staff@example.com"
    assert user.is_staff is True
    membership = RestaurantMembership.objects.get(user=user, restaurant=restaurant)
    assert membership.role == MembershipRole.ADMIN


@pytest.mark.django_db
def test_bootstrap_qr_tenant_requires_password_with_email():
    with pytest.raises(CommandError):
        call_command(
            "bootstrap_qr_tenant",
            slug="missing-password",
            staff_email="staff@example.com",
        )

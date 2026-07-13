from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from rest_framework.exceptions import ValidationError

from kotak.restaurants.models import Restaurant

if TYPE_CHECKING:
    from kotak.restaurants.models import Restaurant as RestaurantModel


class CRMAuthenticationMixin:
    """Skip DRF auth when CRM is open locally; avoids JWT 403 before staff check."""

    def get_authentication_classes(self):
        if getattr(settings, "CRM_OPEN_PERMISSIONS", False):
            return []
        return super().get_authentication_classes()


class RestaurantScopedMixin(CRMAuthenticationMixin):
    """Require ``restaurant_slug`` query param and set ``self.restaurant``."""

    restaurant_query_param = "restaurant_slug"

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        slug = request.query_params.get(self.restaurant_query_param)
        if not slug or not str(slug).strip():
            raise ValidationError(
                {self.restaurant_query_param: ["This query parameter is required."]},
            )
        slug_clean = str(slug).strip()
        try:
            self.restaurant: RestaurantModel = Restaurant.objects.get(slug=slug_clean)
        except Restaurant.DoesNotExist:
            raise ValidationError(
                {
                    self.restaurant_query_param: [
                        f"Unknown restaurant slug: {slug_clean!r}.",
                    ],
                },
            ) from None

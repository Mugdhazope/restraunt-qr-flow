from __future__ import annotations

import django_filters

from kotak.customers.models import Customer
from kotak.feedback.models import Feedback


class CustomerFilter(django_filters.FilterSet):
    tag = django_filters.CharFilter(field_name="tag", lookup_expr="iexact")

    class Meta:
        model = Customer
        fields = ("tag",)


class FeedbackFilter(django_filters.FilterSet):
    """Optional ``rating_min`` / ``rating_max`` query params."""

    rating_min = django_filters.NumberFilter(field_name="rating", lookup_expr="gte")
    rating_max = django_filters.NumberFilter(field_name="rating", lookup_expr="lte")

    class Meta:
        model = Feedback
        fields: tuple[str, ...] = ()

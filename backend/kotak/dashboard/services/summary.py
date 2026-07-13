# ruff: noqa: TC001, E501
from __future__ import annotations

from datetime import datetime
from datetime import time
from datetime import timedelta
from typing import Any

from django.db.models import Avg
from django.db.models import Count
from django.db.models import Q
from django.utils import timezone

from kotak.campaigns.models import CampaignSend
from kotak.customers.models import Customer
from kotak.customers.models import Visit
from kotak.feedback.models import Feedback
from kotak.restaurants.models import Restaurant


def build_dashboard_summary(restaurant: Restaurant) -> dict[str, Any]:
    """Aggregate CRM metrics for one restaurant.

    Positive feedback uses rating >= 4 (same rule as WhatsApp webhook sentiment).
    Counts and percentages include all feedback rows that have a rating.
    """
    total_customers = Customer.objects.filter(restaurant=restaurant).count()
    total_visits = Visit.objects.filter(restaurant=restaurant).count()
    total_feedback = Feedback.objects.filter(restaurant=restaurant).count()

    agg = Feedback.objects.filter(restaurant=restaurant).aggregate(
        positive=Count("id", filter=Q(rating__gte=4)),
    )
    positive_count = agg["positive"] or 0
    if total_feedback == 0:
        positive_pct = 0.0
    else:
        positive_pct = round(100.0 * positive_count / total_feedback, 2)

    recent_feedback = list(
        Feedback.objects.filter(restaurant=restaurant)
        .select_related("customer")
        .order_by("-created_at")[:5],
    )

    today = timezone.localdate()
    start_week = today - timedelta(days=today.weekday())
    start_week_dt = timezone.make_aware(datetime.combine(start_week, time.min))
    new_customers_this_week = Customer.objects.filter(
        restaurant=restaurant,
        created_at__gte=start_week_dt,
    ).count()

    campaigns_sent_count = CampaignSend.objects.filter(
        restaurant=restaurant,
        deleted_at__isnull=True,
    ).count()
    google_review_prompts_sent = restaurant.google_review_prompts_sent

    repeat_customers = Customer.objects.filter(restaurant=restaurant, total_visits__gt=1).count()
    repeat_rate_pct = (
        round(100.0 * repeat_customers / total_customers, 1) if total_customers else 0.0
    )

    avg_rating = Feedback.objects.filter(restaurant=restaurant).aggregate(a=Avg("rating"))["a"]
    avg_feedback_rating = round(float(avg_rating or 0), 2)

    return {
        "total_customers": total_customers,
        "total_visits": total_visits,
        "total_feedback": total_feedback,
        "positive_feedback_percentage": positive_pct,
        "recent_feedback": recent_feedback,
        "new_customers_this_week": new_customers_this_week,
        "campaigns_sent_count": campaigns_sent_count,
        "google_review_prompts_sent": google_review_prompts_sent,
        "repeat_customer_rate": repeat_rate_pct,
        "avg_feedback_rating": avg_feedback_rating,
    }

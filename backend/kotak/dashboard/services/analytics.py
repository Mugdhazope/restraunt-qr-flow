# ruff: noqa: DTZ001, E501, PLR0915, TC001
from __future__ import annotations

import calendar
from datetime import date
from datetime import datetime
from datetime import time
from datetime import timedelta
from typing import Any

from django.db.models import Avg
from django.db.models import Sum
from django.db.models import Q
from django.utils import timezone

from kotak.campaigns.models import CampaignSend
from kotak.customers.models import Customer
from kotak.customers.models import Visit
from kotak.feedback.models import Feedback
from kotak.restaurants.models import Restaurant


def _month_iter_end_exclusive(now: datetime, months: int) -> list[tuple[int, int, datetime]]:
    """Return (year, month, end_instant_utc) for each of the last ``months`` months, oldest first."""
    out: list[tuple[int, int, datetime]] = []
    y, m = now.year, now.month
    for _ in range(months):
        last_day = calendar.monthrange(y, m)[1]
        end_local = datetime(y, m, last_day, 23, 59, 59, 999999)
        if timezone.is_naive(now):
            end = timezone.make_aware(end_local, timezone.get_current_timezone())
        else:
            end = timezone.make_aware(end_local, timezone.get_current_timezone())
        out.append((y, m, end))
        if m == 1:
            m = 12
            y -= 1
        else:
            m -= 1
    return list(reversed(out))


def build_dashboard_analytics(restaurant: Restaurant) -> dict[str, Any]:
    """Charts and extended metrics (cumulative customers, sentiment, visits, funnel)."""
    now = timezone.now()
    tz = timezone.get_current_timezone()
    month_specs = _month_iter_end_exclusive(now, 12)

    customer_growth: list[dict[str, Any]] = []
    for y, m, end in month_specs:
        cumulative = Customer.objects.filter(
            restaurant=restaurant,
            created_at__lte=end,
        ).count()
        label = date(y, m, 1).strftime("%b")
        customer_growth.append({"month": label, "customers": cumulative})

    fb = Feedback.objects.filter(restaurant=restaurant)
    total_fb = fb.count()
    pos = fb.filter(rating__gte=4).count()
    neg = fb.filter(rating__lte=2).count()
    neutral = fb.filter(rating=3).count()

    def pct(n: int) -> float:
        if total_fb == 0:
            return 0.0
        return round(100.0 * n / total_fb, 2)

    sentiment_distribution = [
        {"name": "Positive", "count": pos, "percentage": pct(pos), "fill": "hsl(142, 71%, 45%)"},
        {"name": "Neutral", "count": neutral, "percentage": pct(neutral), "fill": "hsl(220, 9%, 46%)"},
        {"name": "Negative", "count": neg, "percentage": pct(neg), "fill": "hsl(0, 72%, 51%)"},
    ]

    visit_frequency_buckets = []
    qs = Customer.objects.filter(restaurant=restaurant)
    buckets = [
        ("1 visit", Q(total_visits=1)),
        ("2-4 visits", Q(total_visits__gte=2, total_visits__lte=4)),
        ("5-9 visits", Q(total_visits__gte=5, total_visits__lte=9)),
        ("10+ visits", Q(total_visits__gte=10)),
    ]
    for label, q in buckets:
        visit_frequency_buckets.append({"range": label, "count": qs.filter(q).count()})

    visits_by_month: list[dict[str, Any]] = []
    for y, m, end in month_specs:
        start = timezone.make_aware(datetime(y, m, 1, 0, 0, 0), tz)
        n = Visit.objects.filter(
            restaurant=restaurant,
            visit_time__gte=start,
            visit_time__lte=end,
        ).count()
        label = date(y, m, 1).strftime("%b")
        visits_by_month.append({"month": label, "visits": n})

    campaign_sends_by_month: list[dict[str, Any]] = []
    for y, m, end in month_specs:
        start = timezone.make_aware(datetime(y, m, 1, 0, 0, 0), tz)
        campaign_qs = CampaignSend.objects.filter(
            restaurant=restaurant,
            created_at__gte=start,
            created_at__lte=end,
            deleted_at__isnull=True,
        )
        sent = campaign_qs.count()
        opened = int(campaign_qs.aggregate(v=Sum("opened"))["v"] or 0)
        label = date(y, m, 1).strftime("%b")
        campaign_sends_by_month.append({"month": label, "sent": sent, "opened": opened})

    review_funnel = {
        "feedback_received": total_fb,
        "positive_feedback": pos,
        "review_requests_sent": restaurant.google_review_prompts_sent,
        "google_reviews_generated": restaurant.google_review_prompts_sent,
    }

    total_cust = Customer.objects.filter(restaurant=restaurant).count()
    repeaters = Customer.objects.filter(restaurant=restaurant, total_visits__gt=1).count()
    repeat_rate_pct = round(100.0 * repeaters / total_cust, 1) if total_cust else 0.0

    return_rate_by_month: list[dict[str, Any]] = []
    for y, m, end in month_specs:
        cust_to = Customer.objects.filter(restaurant=restaurant, created_at__lte=end).count()
        rep_to = Customer.objects.filter(
            restaurant=restaurant,
            created_at__lte=end,
            total_visits__gt=1,
        ).count()
        rate = round(100.0 * rep_to / cust_to, 1) if cust_to else 0.0
        label = date(y, m, 1).strftime("%b")
        return_rate_by_month.append({"month": label, "rate": rate})

    review_gen_proxy: list[dict[str, Any]] = []
    for y, m, end in month_specs:
        start = timezone.make_aware(datetime(y, m, 1, 0, 0, 0), tz)
        n = fb.filter(
            rating__gte=4,
            is_complete=True,
            created_at__gte=start,
            created_at__lte=end,
        ).count()
        label = date(y, m, 1).strftime("%b")
        review_gen_proxy.append({"month": label, "reviews": n})

    visit_trends_weekly: list[dict[str, Any]] = []
    for i in range(11, -1, -1):
        week_end = (now - timedelta(days=7 * i)).date()
        week_start = week_end - timedelta(days=6)
        start_dt = timezone.make_aware(datetime.combine(week_start, time.min), tz)
        end_dt = timezone.make_aware(datetime.combine(week_end, time.max), tz)
        n = Visit.objects.filter(
            restaurant=restaurant,
            visit_time__gte=start_dt,
            visit_time__lte=end_dt,
        ).count()
        visit_trends_weekly.append({"week": f"{week_start:%m/%d}", "visits": n})

    return {
        "customer_growth": customer_growth,
        "sentiment_distribution": sentiment_distribution,
        "visit_frequency_buckets": visit_frequency_buckets,
        "visits_by_month": visits_by_month,
        "campaign_sends_by_month": campaign_sends_by_month,
        "return_rate_by_month": return_rate_by_month,
        "review_generation_by_month": review_gen_proxy,
        "visit_trends_weekly": visit_trends_weekly,
        "review_funnel": review_funnel,
        "repeat_customer_rate": repeat_rate_pct,
        "avg_feedback_rating": round(
            float(fb.aggregate(a=Avg("rating"))["a"] or 0),
            2,
        ),
    }

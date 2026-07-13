from __future__ import annotations

from celery import shared_task

from kotak.dashboard.services.automations import inactive_customers_for_rule
from kotak.dashboard.services.automations import send_automation_message
from kotak.restaurants.models import AutomationRule
from kotak.restaurants.models import Restaurant


@shared_task
def send_automation_message_task(restaurant_id: int, phone: str, trigger_type: str) -> bool:
    restaurant = Restaurant.objects.get(pk=restaurant_id)
    return send_automation_message(restaurant, phone, trigger_type)


@shared_task
def run_inactive_customers_automation_task() -> dict:
    total_sent = 0
    for rule in AutomationRule.objects.filter(
        trigger_type=AutomationRule.TriggerType.NO_VISIT_14_DAYS,
        enabled=True,
    ).select_related("restaurant"):
        customers = inactive_customers_for_rule(rule.restaurant)
        for customer in customers:
            if send_automation_message(
                rule.restaurant,
                customer.phone,
                AutomationRule.TriggerType.NO_VISIT_14_DAYS,
            ):
                total_sent += 1
    return {"sent": total_sent}

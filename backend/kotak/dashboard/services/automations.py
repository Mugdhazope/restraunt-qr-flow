from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from kotak.customers.models import Customer
from kotak.dashboard.services.whatsapp_dispatch import whatsapp_client_for_restaurant
from kotak.integrations.whatsapp.services import WhatsAppService
from kotak.restaurants.models import AutomationRule
from kotak.restaurants.models import Restaurant


def get_or_create_rule(restaurant: Restaurant, trigger_type: str) -> AutomationRule:
    defaults = {
        AutomationRule.TriggerType.POSITIVE_FEEDBACK: "Thank you so much! 😊\n\nWe'd love a Google review:\n{{google_review_link}}",
        AutomationRule.TriggerType.NO_VISIT_14_DAYS: "Hey! We miss you 👋\n\nCome back this week for something special 😊",
        AutomationRule.TriggerType.THIRD_VISIT_COMPLETED: "Thank you for visiting us 3 times ❤️\n\nWe're so happy to have you with us!",
    }
    rule, _ = AutomationRule.objects.get_or_create(
        restaurant=restaurant,
        trigger_type=trigger_type,
        defaults={"enabled": True, "delay_minutes": 0, "message_template": defaults[trigger_type]},
    )
    return rule


def render_automation_message(rule: AutomationRule, restaurant: Restaurant) -> str:
    message = (rule.message_template or "").strip()
    review_link = (restaurant.google_review_link or "").strip()
    return message.replace("{{google_review_link}}", review_link)


def send_automation_message(restaurant: Restaurant, phone: str, trigger_type: str) -> bool:
    rule = get_or_create_rule(restaurant, trigger_type)
    if not rule.enabled:
        return False
    message = render_automation_message(rule, restaurant)
    if not message:
        return False
    service = WhatsAppService(client=whatsapp_client_for_restaurant(restaurant))
    service.send_text(phone=phone, message=message)
    rule.last_run_at = timezone.now()
    rule.save(update_fields=["last_run_at", "updated_at"])
    return True


def inactive_customers_for_rule(restaurant: Restaurant) -> list[Customer]:
    cutoff = timezone.now() - timedelta(days=14)
    return list(
        Customer.objects.filter(
            restaurant=restaurant,
            is_active=True,
            last_visit__lt=cutoff,
        ).order_by("id"),
    )

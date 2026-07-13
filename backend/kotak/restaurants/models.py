from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Restaurant(models.Model):
    name = models.CharField(_("name"), max_length=255)
    slug = models.SlugField(_("slug"), max_length=255, unique=True, db_index=True)
    location = models.TextField(_("location"), blank=True)
    whatsapp_number = models.CharField(_("WhatsApp number"), max_length=32, blank=True)
    whatsapp_api_token = models.TextField(_("WhatsApp API token"), blank=True)
    whatsapp_phone_number_id = models.CharField(
        _("WhatsApp phone number ID"),
        max_length=64,
        blank=True,
    )
    # Meta Cloud API: template for campaigns; body {{1}} receives the dashboard message.
    whatsapp_broadcast_template_name = models.CharField(
        _("WhatsApp broadcast template name"),
        max_length=512,
        blank=True,
        help_text=_(
            "Meta-approved template name. Body must include one variable; "
            "campaign text fills {{1}}.",
        ),
    )
    whatsapp_broadcast_template_language = models.CharField(
        _("WhatsApp broadcast template language code"),
        max_length=32,
        blank=True,
        default="en",
        help_text=_("Template language code (e.g. en, en_US); must match Meta."),
    )
    # Login OTP: Meta template; body {{1}} = 6-digit code (Authentication or Utility).
    whatsapp_otp_template_name = models.CharField(
        _("WhatsApp OTP template name"),
        max_length=512,
        blank=True,
        help_text=_(
            "Required for OTP outside the 24-hour session window: Meta template name; "
            "body must include {{1}} for the verification code.",
        ),
    )
    whatsapp_otp_template_language = models.CharField(
        _("WhatsApp OTP template language code"),
        max_length=32,
        blank=True,
        default="en",
        help_text=_(
            "Must match the OTP template language in WhatsApp Manager (e.g. en).",
        ),
    )
    # Feedback prompt: Meta template; body {{1}} can include restaurant name.
    whatsapp_feedback_template_name = models.CharField(
        _("WhatsApp feedback template name"),
        max_length=512,
        blank=True,
        help_text=_(
            "Meta-approved template name for post-visit feedback prompt; "
            "body should include {{1}} for restaurant/message context.",
        ),
    )
    whatsapp_feedback_template_language = models.CharField(
        _("WhatsApp feedback template language code"),
        max_length=32,
        blank=True,
        default="en",
        help_text=_("Template language code (e.g. en, en_US); must match Meta."),
    )
    sms_api_key = models.TextField(
        _("SMS API key"),
        blank=True,
        help_text=_("Optional per-outlet SMS provider API key (MSG91)."),
    )
    sms_sender_id = models.CharField(
        _("SMS sender ID"),
        max_length=32,
        blank=True,
        help_text=_("Optional per-outlet sender ID for OTP SMS."),
    )
    sms_template_id = models.CharField(
        _("SMS template ID"),
        max_length=128,
        blank=True,
        help_text=_("Optional per-outlet MSG91 OTP template ID."),
    )
    google_review_link = models.URLField(
        _("Google review link"),
        blank=True,
        max_length=2048,
    )
    google_review_prompts_sent = models.PositiveIntegerField(
        _("Google review prompts sent"),
        default=0,
    )
    scanner_theme = models.JSONField(
        _("scanner theme overrides"),
        default=dict,
        blank=True,
        help_text=_(
            "Optional QR menu appearance overrides: background hex and tag "
            "styles (bg/text/emoji) for new, featured, popular, etc.",
        ),
    )

    class Meta:
        ordering = ["name"]
        verbose_name = _("restaurant")
        verbose_name_plural = _("restaurants")

    def __str__(self) -> str:
        return self.name


class MessageTemplate(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="message_templates",
        verbose_name=_("restaurant"),
    )
    name = models.CharField(_("name"), max_length=255)
    body = models.TextField(_("body"))
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("message template")
        verbose_name_plural = _("message templates")

    def __str__(self) -> str:
        return self.name


class AutomationRule(models.Model):
    class TriggerType(models.TextChoices):
        POSITIVE_FEEDBACK = "positive_feedback", _("Positive feedback")
        NO_VISIT_14_DAYS = "no_visit_14_days", _("No visit for 14 days")
        THIRD_VISIT_COMPLETED = "third_visit_completed", _("Third visit completed")

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="automation_rules",
        verbose_name=_("restaurant"),
    )
    trigger_type = models.CharField(
        _("trigger type"),
        max_length=64,
        choices=TriggerType.choices,
    )
    enabled = models.BooleanField(_("enabled"), default=True)
    delay_minutes = models.PositiveIntegerField(_("delay minutes"), default=0)
    message_template = models.TextField(_("message template"), blank=True)
    last_run_at = models.DateTimeField(_("last run at"), null=True, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("automation rule")
        verbose_name_plural = _("automation rules")
        constraints = [
            models.UniqueConstraint(
                fields=["restaurant", "trigger_type"],
                name="restaurants_unique_automation_trigger_per_restaurant",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.restaurant_id}:{self.trigger_type}"


class MembershipRole(models.TextChoices):
    ADMIN = "admin", _("Admin")
    STAFF = "staff", _("Staff")


class RestaurantMembership(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="restaurant_memberships",
        verbose_name=_("user"),
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="memberships",
        verbose_name=_("restaurant"),
    )
    role = models.CharField(
        _("role"),
        max_length=16,
        choices=MembershipRole.choices,
        default=MembershipRole.STAFF,
    )

    class Meta:
        verbose_name = _("restaurant membership")
        verbose_name_plural = _("restaurant memberships")
        constraints = [
            models.UniqueConstraint(
                fields=["user", "restaurant"],
                name="restaurants_unique_membership_per_user_restaurant",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} @ {self.restaurant}"

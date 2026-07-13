from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy


class CampaignStatus(models.TextChoices):
    DRAFT = "draft", _("Draft")
    SCHEDULED = "scheduled", _("Scheduled")
    SENT = "sent", _("Sent")
    CANCELLED = "cancelled", _("Cancelled")


class Campaign(models.Model):
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="campaigns",
        verbose_name=_("restaurant"),
    )
    name = models.CharField(pgettext_lazy("Campaign model", "name"), max_length=255)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=CampaignStatus.choices,
        default=CampaignStatus.DRAFT,
    )
    message_template = models.TextField(_("message template"), blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("campaign")
        verbose_name_plural = _("campaigns")

    def __str__(self) -> str:
        return self.name


class CampaignSend(models.Model):
    """One campaign execution attempt (initial send or resend)."""

    class DeliveryStatus(models.TextChoices):
        PENDING = "pending", _("Pending")
        SCHEDULED = "scheduled", _("Scheduled")
        PROCESSING = "processing", _("Processing")
        SENT = "sent", _("Sent")
        PARTIAL = "partial", _("Partial")
        FAILED = "failed", _("Failed")
        CANCELLED = "cancelled", _("Cancelled")

    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="campaign_sends",
        verbose_name=_("restaurant"),
    )
    name = models.CharField(_("name"), max_length=255)
    target_type = models.CharField(_("target type"), max_length=32)
    message = models.TextField(_("message"))
    source_campaign = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="resends",
        null=True,
        blank=True,
        verbose_name=_("source campaign"),
    )
    scheduled_for = models.DateTimeField(_("scheduled for"), null=True, blank=True)
    queued_task_id = models.CharField(_("queued task id"), max_length=255, blank=True)
    status = models.CharField(
        _("status"),
        max_length=24,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
    )
    recipient_count = models.PositiveIntegerField(_("recipient count"))
    sent = models.PositiveIntegerField(_("sent"))
    failed = models.PositiveIntegerField(_("failed"))
    delivered = models.PositiveIntegerField(_("delivered"), default=0)
    opened = models.PositiveIntegerField(_("opened"), default=0)
    responses = models.PositiveIntegerField(_("responses"), default=0)
    started_at = models.DateTimeField(_("started at"), null=True, blank=True)
    completed_at = models.DateTimeField(_("completed at"), null=True, blank=True)
    deleted_at = models.DateTimeField(_("deleted at"), null=True, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("campaign send")
        verbose_name_plural = _("campaign sends")

    def __str__(self) -> str:
        return f"{self.name} ({self.created_at:%Y-%m-%d})"


class CampaignRecipientStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    SENT = "sent", _("Sent")
    DELIVERED = "delivered", _("Delivered")
    READ = "read", _("Read")
    FAILED = "failed", _("Failed")
    REPLIED = "replied", _("Replied")


class CampaignRecipientEvent(models.Model):
    campaign_send = models.ForeignKey(
        CampaignSend,
        on_delete=models.CASCADE,
        related_name="recipient_events",
        verbose_name=_("campaign send"),
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        related_name="campaign_events",
        null=True,
        blank=True,
        verbose_name=_("customer"),
    )
    phone = models.CharField(_("phone"), max_length=32)
    wamid = models.CharField(_("WhatsApp message id"), max_length=255, blank=True, db_index=True)
    status = models.CharField(
        _("status"),
        max_length=16,
        choices=CampaignRecipientStatus.choices,
        default=CampaignRecipientStatus.PENDING,
    )
    sent_at = models.DateTimeField(_("sent at"), null=True, blank=True)
    delivered_at = models.DateTimeField(_("delivered at"), null=True, blank=True)
    read_at = models.DateTimeField(_("read at"), null=True, blank=True)
    failed_at = models.DateTimeField(_("failed at"), null=True, blank=True)
    replied_at = models.DateTimeField(_("replied at"), null=True, blank=True)
    read_count = models.PositiveIntegerField(_("read count"), default=0)
    reply_count = models.PositiveIntegerField(_("reply count"), default=0)
    meta_error_code = models.IntegerField(_("meta error code"), null=True, blank=True)
    failure_details = models.TextField(_("failure details"), blank=True)
    last_status_payload = models.JSONField(_("last status payload"), null=True, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("campaign recipient event")
        verbose_name_plural = _("campaign recipient events")
        indexes = [
            models.Index(fields=["campaign_send", "phone"]),
            models.Index(fields=["campaign_send", "status"]),
        ]

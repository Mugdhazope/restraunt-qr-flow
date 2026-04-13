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

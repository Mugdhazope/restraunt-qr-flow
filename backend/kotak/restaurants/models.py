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
    google_review_link = models.URLField(_("Google review link"), blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = _("restaurant")
        verbose_name_plural = _("restaurants")

    def __str__(self) -> str:
        return self.name

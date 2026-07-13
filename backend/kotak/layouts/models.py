from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class PageKey(models.TextChoices):
    WELCOME = "welcome", _("Welcome")
    CHECKED_IN = "checked_in", _("Checked In")
    MENU = "menu", _("Menu")
    ITEM_DETAIL = "item_detail", _("Item Detail")


class PageLayout(models.Model):
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="page_layouts",
        verbose_name=_("restaurant"),
    )
    page_key = models.CharField(
        _("page key"),
        max_length=32,
        choices=PageKey.choices,
    )
    version = models.PositiveIntegerField(_("version"), default=1)
    schema_version = models.PositiveIntegerField(_("schema version"), default=2)
    layout = models.JSONField(_("layout"), default=dict, blank=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_page_layouts",
        verbose_name=_("updated by"),
    )

    class Meta:
        ordering = ["page_key"]
        verbose_name = _("page layout")
        verbose_name_plural = _("page layouts")
        constraints = [
            models.UniqueConstraint(
                fields=["restaurant", "page_key"],
                name="layouts_pagelayout_restaurant_page_key_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.restaurant.slug}:{self.page_key} v{self.version}"

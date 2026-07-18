from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from kotak.layouts.image_utils import layout_asset_upload_to


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


class LayoutAsset(models.Model):
    """Per-outlet image asset for layout backgrounds (URL stored in layout JSON)."""

    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="layout_assets",
        verbose_name=_("restaurant"),
    )
    image = models.ImageField(
        _("image"),
        upload_to=layout_asset_upload_to,
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_layout_assets",
        verbose_name=_("created by"),
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("layout asset")
        verbose_name_plural = _("layout assets")

    def __str__(self) -> str:
        return f"{self.restaurant.slug}:asset:{self.pk}"

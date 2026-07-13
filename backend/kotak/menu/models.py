from django.core.validators import MaxValueValidator
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from kotak.menu.image_utils import menu_item_image_upload_to


class MenuCategory(models.Model):
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="menu_categories",
        verbose_name=_("restaurant"),
    )
    name = models.CharField(_("name"), max_length=255)

    class Meta:
        ordering = ["name"]
        verbose_name = _("menu category")
        verbose_name_plural = _("menu categories")
        constraints = [
            models.UniqueConstraint(
                fields=["restaurant", "name"],
                name="menu_unique_category_name_per_restaurant",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.restaurant}: {self.name}"


class MenuItem(models.Model):
    category = models.ForeignKey(
        MenuCategory,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("category"),
    )
    name = models.CharField(_("name"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    price = models.DecimalField(_("price"), max_digits=10, decimal_places=2)
    image = models.ImageField(
        _("image"),
        upload_to=menu_item_image_upload_to,
        blank=True,
    )
    tag = models.CharField(_("tag"), max_length=64, blank=True)
    is_featured = models.BooleanField(_("featured"), default=False)
    is_new = models.BooleanField(_("new"), default=False)
    is_jain = models.BooleanField(_("Jain option"), default=False)
    image_scale = models.PositiveSmallIntegerField(
        _("image scale percent"),
        default=100,
        validators=[MinValueValidator(50), MaxValueValidator(200)],
    )

    class Meta:
        ordering = ["category", "name"]
        verbose_name = _("menu item")
        verbose_name_plural = _("menu items")
        constraints = [
            models.UniqueConstraint(
                fields=["category", "name"],
                name="menu_unique_item_name_per_category",
            ),
        ]

    def __str__(self) -> str:
        return self.name

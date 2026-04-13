from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomerTag(models.TextChoices):
    VIP = "vip", _("VIP")
    FREQUENT = "frequent", _("Frequent")
    FIRST_TIME = "first_time", _("First time")
    REGULAR = "regular", _("Regular")


class Customer(models.Model):
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="customers",
        verbose_name=_("restaurant"),
    )
    name = models.CharField(_("name"), max_length=255)
    phone = models.CharField(_("phone"), max_length=32)
    total_visits = models.PositiveIntegerField(_("total visits"), default=0)
    last_visit = models.DateTimeField(_("last visit"), null=True, blank=True)
    tag = models.CharField(
        _("tag"),
        max_length=32,
        choices=CustomerTag.choices,
        default=CustomerTag.FIRST_TIME,
    )
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = _("customer")
        verbose_name_plural = _("customers")
        constraints = [
            models.UniqueConstraint(
                fields=["restaurant", "phone"],
                name="customers_unique_phone_per_restaurant",
            ),
        ]
        indexes = [
            models.Index(fields=["restaurant", "phone"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"


class Visit(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="visits",
        verbose_name=_("customer"),
    )
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="visits",
        verbose_name=_("restaurant"),
    )
    visit_time = models.DateTimeField(_("visit time"), auto_now_add=True)

    class Meta:
        ordering = ["-visit_time"]
        verbose_name = _("visit")
        verbose_name_plural = _("visits")
        indexes = [
            models.Index(fields=["restaurant", "visit_time"]),
            models.Index(fields=["customer", "visit_time"]),
        ]

    def __str__(self) -> str:
        return f"{self.customer} @ {self.visit_time:%Y-%m-%d %H:%M}"

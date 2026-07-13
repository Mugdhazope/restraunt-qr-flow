from django.db import models
from django.utils.translation import gettext_lazy as _


class OTP(models.Model):
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="otps",
        verbose_name=_("restaurant"),
        null=True,
        blank=True,
    )
    phone = models.CharField(_("phone"), max_length=32, db_index=True)
    code = models.CharField(_("code"), max_length=8)
    is_verified = models.BooleanField(_("verified"), default=False)
    is_used = models.BooleanField(_("used"), default=False)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    expires_at = models.DateTimeField(_("expires at"), null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("OTP")
        verbose_name_plural = _("OTPs")
        indexes = [
            models.Index(fields=["phone", "created_at"]),
            models.Index(fields=["restaurant", "phone", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.phone} @ {self.created_at:%Y-%m-%d %H:%M}"

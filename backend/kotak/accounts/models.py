from django.db import models
from django.utils.translation import gettext_lazy as _


class OTP(models.Model):
    phone = models.CharField(_("phone"), max_length=32, db_index=True)
    code = models.CharField(_("code"), max_length=8)
    is_verified = models.BooleanField(_("verified"), default=False)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("OTP")
        verbose_name_plural = _("OTPs")
        indexes = [
            models.Index(fields=["phone", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.phone} @ {self.created_at:%Y-%m-%d %H:%M}"

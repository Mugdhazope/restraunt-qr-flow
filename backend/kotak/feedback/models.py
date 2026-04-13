from django.core.validators import MaxValueValidator
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Sentiment(models.TextChoices):
    POSITIVE = "positive", _("Positive")
    NEGATIVE = "negative", _("Negative")
    NEUTRAL = "neutral", _("Neutral")


class Feedback(models.Model):
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.CASCADE,
        related_name="feedbacks",
        verbose_name=_("customer"),
    )
    restaurant = models.ForeignKey(
        "restaurants.Restaurant",
        on_delete=models.CASCADE,
        related_name="feedbacks",
        verbose_name=_("restaurant"),
    )
    rating = models.PositiveSmallIntegerField(
        _("rating"),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    message = models.TextField(_("message"), blank=True)
    is_complete = models.BooleanField(_("complete"), default=False)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    sentiment = models.CharField(
        _("sentiment"),
        max_length=16,
        choices=Sentiment.choices,
        blank=True,
    )

    class Meta:
        ordering = ["-id"]
        verbose_name = _("feedback")
        verbose_name_plural = _("feedbacks")

    def __str__(self) -> str:
        return f"{self.customer} — {self.rating}/5"

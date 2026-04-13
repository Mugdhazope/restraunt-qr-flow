from django.contrib import admin

from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = (
        "customer",
        "restaurant",
        "rating",
        "message_preview",
        "is_complete",
        "created_at",
        "sentiment",
    )
    list_filter = ("restaurant", "rating", "is_complete", "sentiment")
    search_fields = ("customer__name", "customer__phone", "message")
    autocomplete_fields = ("customer", "restaurant")
    readonly_fields = ("created_at",)

    @admin.display(description="message")
    def message_preview(self, obj: Feedback) -> str:
        text = (obj.message or "").strip()
        if len(text) <= 60:
            return text
        return f"{text[:57]}…"

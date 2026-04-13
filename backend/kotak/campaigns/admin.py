from django.contrib import admin

from .models import Campaign


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("name", "restaurant", "status", "created_at")
    list_filter = ("restaurant", "status", "created_at")
    search_fields = ("name", "message_template")
    autocomplete_fields = ("restaurant",)
    readonly_fields = ("created_at",)

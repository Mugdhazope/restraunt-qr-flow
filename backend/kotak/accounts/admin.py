from django.contrib import admin

from .models import OTP


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("phone", "code", "is_verified", "created_at")
    list_filter = ("is_verified", "created_at")
    search_fields = ("phone",)
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"

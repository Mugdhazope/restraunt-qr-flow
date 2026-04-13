from django.contrib import admin

from .models import Restaurant


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "whatsapp_number", "whatsapp_phone_number_id")
    search_fields = ("name", "slug", "location", "whatsapp_number")
    prepopulated_fields = {"slug": ("name",)}

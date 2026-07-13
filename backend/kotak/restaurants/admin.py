from django.contrib import admin

from .models import MessageTemplate
from .models import Restaurant
from .models import RestaurantMembership


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "whatsapp_number", "whatsapp_phone_number_id")
    search_fields = ("name", "slug", "location", "whatsapp_number")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "restaurant", "created_at")
    list_filter = ("restaurant",)


@admin.register(RestaurantMembership)
class RestaurantMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "restaurant", "role")
    list_filter = ("restaurant", "role")

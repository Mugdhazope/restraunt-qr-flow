from django.contrib import admin

from .models import Customer
from .models import Visit


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "restaurant", "tag", "total_visits", "last_visit", "is_active")
    list_filter = ("restaurant", "tag", "is_active")
    search_fields = ("name", "phone")
    autocomplete_fields = ("restaurant",)


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("customer", "restaurant", "visit_time")
    list_filter = ("restaurant", "visit_time")
    search_fields = ("customer__name", "customer__phone")
    autocomplete_fields = ("customer", "restaurant")
    date_hierarchy = "visit_time"

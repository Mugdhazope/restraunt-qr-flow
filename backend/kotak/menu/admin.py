from django.contrib import admin

from .models import MenuCategory
from .models import MenuItem


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "restaurant")
    list_filter = ("restaurant",)
    search_fields = ("name", "restaurant__name")
    autocomplete_fields = ("restaurant",)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "is_featured", "is_new")
    list_filter = ("category__restaurant", "is_featured", "is_new", "category")
    search_fields = ("name", "description", "tag")
    autocomplete_fields = ("category",)

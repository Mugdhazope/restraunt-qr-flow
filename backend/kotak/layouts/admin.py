from django.contrib import admin

from kotak.layouts.models import LayoutAsset
from kotak.layouts.models import PageLayout


@admin.register(PageLayout)
class PageLayoutAdmin(admin.ModelAdmin):
    list_display = ("restaurant", "page_key", "version", "schema_version", "updated_at")
    list_filter = ("page_key",)
    search_fields = ("restaurant__slug", "restaurant__name")
    readonly_fields = ("updated_at", "version")


@admin.register(LayoutAsset)
class LayoutAssetAdmin(admin.ModelAdmin):
    list_display = ("restaurant", "id", "created_at")
    search_fields = ("restaurant__slug",)
    readonly_fields = ("created_at",)

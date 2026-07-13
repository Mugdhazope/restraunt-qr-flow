from __future__ import annotations

from rest_framework import serializers

from kotak.layouts.models import PageKey
from kotak.layouts.models import PageLayout
from kotak.layouts.validation import validate_layout_document


class PageLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageLayout
        fields = (
            "id",
            "page_key",
            "version",
            "schema_version",
            "layout",
            "updated_at",
        )
        read_only_fields = ("id", "version", "schema_version", "updated_at")


class PageLayoutWriteSerializer(serializers.Serializer):
    page_key = serializers.ChoiceField(choices=PageKey.choices)
    layout = serializers.JSONField()
    expected_version = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        page_key = attrs["page_key"]
        attrs["layout"] = validate_layout_document(attrs["layout"], page_key=page_key, strict=True)
        attrs["schema_version"] = attrs["layout"].get("schema_version", 1)
        return attrs


class PageLayoutListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageLayout
        fields = ("id", "page_key", "version", "schema_version", "updated_at")


class PublicPageLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageLayout
        fields = ("page_key", "version", "schema_version", "layout", "updated_at")

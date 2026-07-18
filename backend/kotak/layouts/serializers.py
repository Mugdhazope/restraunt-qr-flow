from __future__ import annotations

from rest_framework import serializers

from kotak.layouts.images import process_uploaded_layout_image
from kotak.layouts.models import LayoutAsset
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


class LayoutAssetUploadSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True, allow_empty_file=False)

    def create(self, validated_data):
        restaurant = self.context["restaurant"]
        request = self.context.get("request")
        uploaded = validated_data["image"]
        cf = process_uploaded_layout_image(uploaded)
        asset = LayoutAsset(
            restaurant=restaurant,
            created_by=request.user if request and request.user.is_authenticated else None,
        )
        asset.image.save(cf.name, cf, save=True)
        return asset

    def to_representation(self, instance: LayoutAsset):
        request = self.context.get("request")
        url = instance.image.url
        if request and not str(url).startswith(("http://", "https://")):
            url = request.build_absolute_uri(url)
        return {"id": instance.pk, "url": url}

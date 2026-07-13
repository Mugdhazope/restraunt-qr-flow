from __future__ import annotations

from rest_framework import serializers


class MenuBulkRowSerializer(serializers.Serializer):
    category_name = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    tag = serializers.CharField(required=False, allow_blank=True, default="")
    is_featured = serializers.BooleanField(required=False, default=False)
    is_new = serializers.BooleanField(required=False, default=False)
    is_jain = serializers.BooleanField(required=False, default=False)

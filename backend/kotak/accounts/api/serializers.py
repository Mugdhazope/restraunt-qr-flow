# ruff: noqa: TRY003, EM101, E501
from __future__ import annotations

import re

from rest_framework import serializers

from kotak.restaurants.models import Restaurant

E164_PHONE_REGEX = re.compile(r"^\+[1-9]\d{7,14}$")
OTP_REGEX = re.compile(r"^\d{6}$")


class SendOTPSerializer(serializers.Serializer):
    restaurant_slug = serializers.SlugField(max_length=255)
    phone = serializers.CharField(max_length=16)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_restaurant_slug(self, value: str) -> str:
        if not Restaurant.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Restaurant not found.")
        return value

    def validate_phone(self, value: str) -> str:
        if not E164_PHONE_REGEX.match(value):
            raise serializers.ValidationError("Phone must be in E.164 format, e.g. +919999999999.")
        return value

    def validate_name(self, value: str) -> str:
        return value.strip()


class VerifyOTPSerializer(SendOTPSerializer):
    otp = serializers.CharField(max_length=6, min_length=6)

    def validate_otp(self, value: str) -> str:
        if not OTP_REGEX.match(value):
            raise serializers.ValidationError("OTP must be a 6-digit numeric code.")
        return value

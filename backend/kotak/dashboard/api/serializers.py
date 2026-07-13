from __future__ import annotations

import re
import uuid

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from rest_framework import serializers
from rest_framework.exceptions import ValidationError as DRFValidationError

from kotak.campaigns.models import CampaignSend
from kotak.customers.models import Customer
from kotak.customers.models import CustomerTag
from kotak.customers.models import Visit
from kotak.dashboard.services.segments import CampaignTargetType
from kotak.feedback.models import Feedback
from kotak.menu.images import process_uploaded_menu_image
from kotak.menu.models import MenuCategory
from kotak.menu.models import MenuItem
from kotak.restaurants.models import MessageTemplate
from kotak.restaurants.models import AutomationRule
from kotak.restaurants.models import Restaurant
from kotak.restaurants.models import RestaurantMembership

_HEX_COLOR_RE = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
_SCANNER_TAG_KEYS = frozenset(
    {"new", "featured", "popular", "bestseller", "chefs_pick", "jain"},
)
_EMOJI_MAX_LEN = 8


def validate_scanner_theme(value) -> dict:
    """Normalize/validate Restaurant.scanner_theme JSON. Invalid hex/emoji → 400."""
    if value in (None, ""):
        return {}
    if not isinstance(value, dict):
        raise DRFValidationError("scanner_theme must be an object.")
    out: dict = {}
    if "background" in value and value["background"] not in (None, ""):
        bg = str(value["background"]).strip()
        if not _HEX_COLOR_RE.match(bg):
            raise DRFValidationError(
                {"background": ["Use a hex color like #RGB or #RRGGBB."]},
            )
        out["background"] = bg
    tags_in = value.get("tags")
    if tags_in is None:
        return out
    if not isinstance(tags_in, dict):
        raise DRFValidationError({"tags": ["tags must be an object."]})
    tags_out: dict = {}
    for key, raw in tags_in.items():
        if key not in _SCANNER_TAG_KEYS:
            continue
        if raw in (None, ""):
            continue
        if not isinstance(raw, dict):
            raise DRFValidationError({f"tags.{key}": ["Tag style must be an object."]})
        entry: dict = {}
        for color_key in ("bg", "text"):
            if color_key not in raw or raw[color_key] in (None, ""):
                continue
            c = str(raw[color_key]).strip()
            if not _HEX_COLOR_RE.match(c):
                raise DRFValidationError(
                    {f"tags.{key}.{color_key}": ["Use a hex color like #RGB or #RRGGBB."]},
                )
            entry[color_key] = c
        if "emoji" in raw and raw["emoji"] is not None:
            emoji = str(raw["emoji"]).strip()
            if len(emoji) > _EMOJI_MAX_LEN:
                raise DRFValidationError(
                    {f"tags.{key}.emoji": [f"Emoji must be at most {_EMOJI_MAX_LEN} characters."]},
                )
            entry["emoji"] = emoji
        if entry:
            tags_out[key] = entry
    if tags_out:
        out["tags"] = tags_out
    return out


class CustomerNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ("id", "name", "phone")


class RecentFeedbackSerializer(serializers.ModelSerializer):
    customer = CustomerNestedSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = ("id", "customer", "rating", "message", "created_at")


class FeedbackListSerializer(serializers.ModelSerializer):
    customer = CustomerNestedSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = ("id", "customer", "rating", "message", "created_at", "is_complete")


class FeedbackPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ("is_complete",)


class FeedbackHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ("id", "rating", "message", "created_at", "is_complete", "sentiment")


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ("id", "name", "phone", "total_visits", "last_visit", "tag", "created_at")
        read_only_fields = fields


class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ("id", "visit_time")


class CustomerPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ("tag", "notes")

    def validate_tag(self, value: str) -> str:
        valid = {c.value for c in CustomerTag}
        if value not in valid:
            err = "Invalid tag."
            raise serializers.ValidationError(err)
        return value


class CustomerDetailSerializer(serializers.ModelSerializer):
    visits = VisitSerializer(many=True, read_only=True)
    feedback_history = FeedbackHistorySerializer(
        source="feedbacks",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Customer
        fields = (
            "id",
            "name",
            "phone",
            "total_visits",
            "last_visit",
            "tag",
            "is_active",
            "notes",
            "created_at",
            "visits",
            "feedback_history",
        )
        read_only_fields = (
            "id",
            "name",
            "phone",
            "total_visits",
            "last_visit",
            "tag",
            "is_active",
            "created_at",
            "visits",
            "feedback_history",
        )


class DashboardSummarySerializer(serializers.Serializer):
    total_customers = serializers.IntegerField()
    total_visits = serializers.IntegerField()
    total_feedback = serializers.IntegerField()
    positive_feedback_percentage = serializers.FloatField()
    recent_feedback = RecentFeedbackSerializer(many=True)
    new_customers_this_week = serializers.IntegerField()
    campaigns_sent_count = serializers.IntegerField()
    google_review_prompts_sent = serializers.IntegerField()
    repeat_customer_rate = serializers.FloatField()
    avg_feedback_rating = serializers.FloatField()


class CampaignSendSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False, default="WhatsApp campaign")
    message = serializers.CharField(allow_blank=False)
    target_type = serializers.ChoiceField(
        choices=[
            CampaignTargetType.ALL,
            CampaignTargetType.VIP,
            CampaignTargetType.FREQUENT,
            CampaignTargetType.INACTIVE,
            CampaignTargetType.FIRST_TIME,
            CampaignTargetType.NEUTRAL,
            CampaignTargetType.INACTIVE_TAG,
        ],
    )
    scheduled_for = serializers.DateTimeField(required=False, allow_null=True)


class CampaignFailureSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField()
    phone = serializers.CharField()
    error = serializers.CharField()


class CampaignSendResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    target_type = serializers.CharField()
    recipient_count = serializers.IntegerField()
    sent = serializers.IntegerField()
    failed = serializers.IntegerField()
    failures = CampaignFailureSerializer(many=True)
    error_summary = serializers.CharField(required=False, allow_null=True)


class CampaignSendQueuedResponseSerializer(serializers.Serializer):
    queued = serializers.BooleanField()
    task_id = serializers.CharField()
    recipient_count = serializers.IntegerField()
    name = serializers.CharField()
    target_type = serializers.CharField()


class CampaignSendHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignSend
        fields = (
            "id",
            "name",
            "target_type",
            "message",
            "recipient_count",
            "sent",
            "failed",
            "delivered",
            "opened",
            "responses",
            "scheduled_for",
            "status",
            "created_at",
        )
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["audience"] = data["target_type"]
        data["date"] = data["created_at"]
        return data


class CampaignResendSerializer(serializers.Serializer):
    scheduled_for = serializers.DateTimeField(required=False, allow_null=True)


class AutomationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationRule
        fields = (
            "id",
            "trigger_type",
            "enabled",
            "delay_minutes",
            "message_template",
            "last_run_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "last_run_at", "created_at", "updated_at")


class CustomerImportRowSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=32)
    tag = serializers.CharField(max_length=32, required=False, allow_blank=True)


class CustomerBulkImportSerializer(serializers.Serializer):
    customers = serializers.ListField(child=CustomerImportRowSerializer(), min_length=1)


class CustomerImportResultSerializer(serializers.Serializer):
    created = serializers.IntegerField()
    updated = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.DictField())


class MenuItemReadSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = (
            "id",
            "category",
            "name",
            "description",
            "price",
            "tag",
            "is_featured",
            "is_new",
            "is_jain",
            "image_scale",
            "image_url",
        )

    def get_image_url(self, obj: MenuItem) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        u = str(url)
        if u.startswith(("http://", "https://")):
            return u
        if request is not None:
            return request.build_absolute_uri(url)
        return u


class MenuItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = (
            "id",
            "category",
            "name",
            "description",
            "price",
            "tag",
            "is_featured",
            "is_new",
            "is_jain",
            "image_scale",
            "image",
        )
        read_only_fields = ("id",)
        # Prefer validate() message over auto UniqueTogetherValidator wording.
        validators = []
        extra_kwargs = {
            "image": {"write_only": True, "required": False, "allow_null": True},
            "description": {"required": False, "allow_blank": True},
            "tag": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        name = attrs.get("name")
        if name is None and self.instance is not None:
            name = self.instance.name
        if category is not None and name is not None:
            name = str(name).strip()
            attrs["name"] = name
            qs = MenuItem.objects.filter(category=category, name=name)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {
                        "name": [
                            f'An item named "{name}" already exists in this category.',
                        ],
                    },
                )
        return attrs

    def create(self, validated_data):
        uploaded = validated_data.pop("image", None)
        instance = MenuItem.objects.create(**validated_data)
        if uploaded is not None:
            self._assign_image(instance, uploaded)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        _unset = object()
        uploaded = validated_data.pop("image", _unset)
        for key, val in validated_data.items():
            setattr(instance, key, val)
        if uploaded is not _unset:
            self._assign_image(instance, uploaded)
        instance.save()
        return instance

    def _assign_image(self, instance: MenuItem, uploaded) -> None:
        if uploaded in (None, ""):
            if instance.image:
                instance.image.delete(save=False)
                instance.image = None
            return
        cf = process_uploaded_menu_image(uploaded)
        if instance.image:
            instance.image.delete(save=False)
        instance.image.save(f"{uuid.uuid4().hex}.png", cf, save=False)


class MenuCategorySerializer(serializers.ModelSerializer):
    items = MenuItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = MenuCategory
        fields = ("id", "restaurant", "name", "items")
        read_only_fields = ("id", "restaurant", "items")


class MenuCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ("id", "name")
        read_only_fields = ("id",)

    def validate_name(self, value: str) -> str:
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Category name is required.")
        restaurant = self.context.get("restaurant")
        if restaurant is not None:
            qs = MenuCategory.objects.filter(restaurant=restaurant, name=value)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f'A category named "{value}" already exists for this restaurant.',
                )
        return value


class RestaurantStaffSerializer(serializers.ModelSerializer):
    def validate_google_review_link(self, value: str) -> str:
        value = (value or "").strip()
        if not value:
            return ""
        if not value.startswith(("http://", "https://")):
            value = f"https://{value.lstrip('/')}"
        validator = URLValidator()
        try:
            validator(value)
        except DjangoValidationError as exc:
            raise DRFValidationError(
                "Enter a valid review link (include https:// or a full URL).",
            ) from exc
        return value

    def validate_whatsapp_api_token(self, value: str) -> str:
        value = (value or "").strip()
        if value and ("…" in value or value == "****"):
            raise DRFValidationError(
                "Paste a full access token (do not use the shortened preview from the API).",
            )
        return value

    def validate_sms_api_key(self, value: str) -> str:
        value = (value or "").strip()
        if value and "…" in value:
            raise DRFValidationError(
                "Paste the full SMS API key (not the shortened preview).",
            )
        return value

    def validate_scanner_theme(self, value):
        return validate_scanner_theme(value)

    class Meta:
        model = Restaurant
        fields = (
            "id",
            "name",
            "slug",
            "location",
            "whatsapp_number",
            "whatsapp_api_token",
            "whatsapp_phone_number_id",
            "whatsapp_broadcast_template_name",
            "whatsapp_broadcast_template_language",
            "whatsapp_otp_template_name",
            "whatsapp_otp_template_language",
            "whatsapp_feedback_template_name",
            "whatsapp_feedback_template_language",
            "sms_api_key",
            "sms_sender_id",
            "sms_template_id",
            "google_review_link",
            "google_review_prompts_sent",
            "scanner_theme",
        )
        read_only_fields = ("id", "slug", "google_review_prompts_sent")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        tok = data.get("whatsapp_api_token") or ""
        if tok:
            prefix_len = 4
            data["whatsapp_api_token"] = f"{tok[:prefix_len]}…" if len(tok) > prefix_len else "****"
        sms_key = data.get("sms_api_key") or ""
        if sms_key:
            prefix_len = 4
            data["sms_api_key"] = f"{sms_key[:prefix_len]}…" if len(sms_key) > prefix_len else "****"
        return data


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = ("id", "restaurant", "name", "body", "created_at")
        read_only_fields = ("id", "restaurant", "created_at")


class TeamMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = RestaurantMembership
        fields = ("id", "username", "email", "name", "role", "restaurant")
        read_only_fields = fields

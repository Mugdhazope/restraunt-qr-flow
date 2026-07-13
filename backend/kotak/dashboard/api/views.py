# ruff: noqa: E501
from __future__ import annotations

import csv
import json
from io import BytesIO
from io import StringIO

from django.conf import settings
from django.db.models import Prefetch
from django.utils import timezone
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import extend_schema_view
from openpyxl import Workbook
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.filters import SearchFilter
from rest_framework.mixins import DestroyModelMixin
from rest_framework.mixins import ListModelMixin
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.mixins import UpdateModelMixin
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework.viewsets import ModelViewSet
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.viewsets import ViewSet

from kotak.campaigns.models import CampaignSend
from kotak.campaigns.tasks import send_campaign_whatsapp_task
from kotak.customers.models import Customer
from kotak.customers.models import Visit
from kotak.dashboard.api.filters import CustomerFilter
from kotak.dashboard.api.filters import FeedbackFilter
from kotak.dashboard.api.serializers import CampaignSendHistorySerializer
from kotak.dashboard.api.serializers import CampaignSendQueuedResponseSerializer
from kotak.dashboard.api.serializers import CampaignResendSerializer
from kotak.dashboard.api.serializers import CampaignSendResponseSerializer
from kotak.dashboard.api.serializers import CampaignSendSerializer
from kotak.dashboard.api.serializers import CustomerBulkImportSerializer
from kotak.dashboard.api.serializers import CustomerDetailSerializer
from kotak.dashboard.api.serializers import CustomerImportResultSerializer
from kotak.dashboard.api.serializers import CustomerListSerializer
from kotak.dashboard.api.serializers import CustomerPatchSerializer
from kotak.dashboard.api.serializers import DashboardSummarySerializer
from kotak.dashboard.api.serializers import FeedbackListSerializer
from kotak.dashboard.api.serializers import FeedbackPatchSerializer
from kotak.dashboard.api.serializers import MenuCategorySerializer
from kotak.dashboard.api.serializers import MenuCategoryWriteSerializer
from kotak.dashboard.api.serializers import MenuItemReadSerializer
from kotak.dashboard.api.serializers import MenuItemWriteSerializer
from kotak.dashboard.api.serializers import MessageTemplateSerializer
from kotak.dashboard.api.serializers import AutomationRuleSerializer
from kotak.dashboard.api.serializers import RestaurantStaffSerializer
from kotak.dashboard.api.serializers import TeamMemberSerializer
from kotak.dashboard.mixins import CRMAuthenticationMixin
from kotak.dashboard.mixins import RestaurantScopedMixin
from kotak.dashboard.permissions import IsStaffUser
from kotak.dashboard.services.analytics import build_dashboard_analytics
from kotak.dashboard.services.customer_import import import_customers
from kotak.dashboard.services.segments import customers_for_target
from kotak.dashboard.services.summary import build_dashboard_summary
from kotak.feedback.models import Feedback
from kotak.menu.bulk_import import parse_bulk_manifest
from kotak.menu.bulk_import import run_menu_bulk_upload
from kotak.menu.models import MenuCategory
from kotak.menu.models import MenuItem
from kotak.restaurants.models import MessageTemplate
from kotak.restaurants.models import AutomationRule
from kotak.restaurants.models import Restaurant
from kotak.restaurants.models import RestaurantMembership

_RESTAURANT_SLUG_PARAM = OpenApiParameter(
    name="restaurant_slug",
    type=str,
    location=OpenApiParameter.QUERY,
    required=True,
    description="Restaurant slug (tenant scope).",
)


@extend_schema(tags=["Dashboard"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class DashboardViewSet(RestaurantScopedMixin, ViewSet):
    permission_classes = [IsStaffUser]

    def list(self, request):
        payload = build_dashboard_summary(self.restaurant)
        return Response(DashboardSummarySerializer(payload).data)

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        return Response(build_dashboard_analytics(self.restaurant))


@extend_schema(tags=["CRM Customers"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(retrieve=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(partial_update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class CustomerViewSet(
    RestaurantScopedMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    GenericViewSet,
):
    permission_classes = [IsStaffUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CustomerFilter
    search_fields = ("name", "phone")
    ordering_fields = ("name", "last_visit", "total_visits", "phone", "id", "created_at")
    ordering = ("name",)

    def get_queryset(self):
        visit_qs = Visit.objects.order_by("-visit_time")
        feedback_qs = Feedback.objects.order_by("-created_at")
        return (
            Customer.objects.filter(restaurant=self.restaurant)
            .select_related("restaurant")
            .prefetch_related(
                Prefetch("visits", queryset=visit_qs),
                Prefetch("feedbacks", queryset=feedback_qs),
            )
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CustomerDetailSerializer
        return CustomerListSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        ser = CustomerPatchSerializer(instance, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)
        ser.save()
        instance.refresh_from_db()
        return Response(CustomerDetailSerializer(instance, context=self.get_serializer_context()).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM],
        request=CustomerBulkImportSerializer,
        responses={200: CustomerImportResultSerializer},
    )
    @action(detail=False, methods=["post"], url_path="import")
    def import_customers(self, request):
        ser = CustomerBulkImportSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = import_customers(
            self.restaurant,
            [dict(r) for r in ser.validated_data["customers"]],
        )
        return Response(CustomerImportResultSerializer(result).data)

    @extend_schema(parameters=[_RESTAURANT_SLUG_PARAM], responses={200: OpenApiTypes.BINARY})
    @action(detail=False, methods=["get"], url_path="import/sample-csv")
    def import_sample_csv(self, request):
        buf = StringIO()
        w = csv.writer(buf)
        w.writerow(["Name", "Phone", "Tag"])
        w.writerow(["Rahul Sharma", "+919876543210", "vip"])
        w.writerow(["Sample User", "+919876543211", ""])
        data = buf.getvalue().encode("utf-8")
        resp = HttpResponse(data, content_type="text/csv; charset=utf-8")
        resp["Content-Disposition"] = 'attachment; filename="customer-import-sample.csv"'
        return resp

    @extend_schema(parameters=[_RESTAURANT_SLUG_PARAM], responses={200: OpenApiTypes.BINARY})
    @action(detail=False, methods=["get"], url_path="import/sample-xlsx")
    def import_sample_xlsx(self, request):
        wb = Workbook()
        ws = wb.active
        ws.title = "Customers"
        ws.append(["Name", "Phone", "Tag"])
        ws.append(["Rahul Sharma", "+919876543210", "vip"])
        ws.append(["Sample User", "+919876543211", ""])
        bio = BytesIO()
        wb.save(bio)
        bio.seek(0)
        resp = HttpResponse(
            bio.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        resp["Content-Disposition"] = 'attachment; filename="customer-import-sample.xlsx"'
        return resp


@extend_schema(tags=["CRM Feedback"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(retrieve=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(partial_update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class FeedbackViewSet(RestaurantScopedMixin, UpdateModelMixin, ReadOnlyModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = FeedbackListSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = FeedbackFilter
    ordering_fields = ("created_at", "rating", "id")
    ordering = ("-created_at",)
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return (
            Feedback.objects.filter(restaurant=self.restaurant)
            .select_related("customer")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return FeedbackPatchSerializer
        return FeedbackListSerializer


@extend_schema(tags=["CRM Campaigns"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class CampaignViewSet(RestaurantScopedMixin, ListModelMixin, DestroyModelMixin, GenericViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = CampaignSendHistorySerializer
    ordering = ("-created_at",)

    def get_queryset(self):
        return CampaignSend.objects.filter(restaurant=self.restaurant, deleted_at__isnull=True).order_by("-created_at")

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM],
        request=CampaignSendSerializer,
        responses={
            200: CampaignSendResponseSerializer,
            202: CampaignSendQueuedResponseSerializer,
        },
    )
    @action(detail=False, methods=["post"], url_path="send")
    def send(self, request):
        ser = CampaignSendSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        target = ser.validated_data["target_type"]
        message = ser.validated_data["message"]
        name = ser.validated_data.get("name") or "WhatsApp campaign"
        qs = customers_for_target(self.restaurant, target)
        customer_ids = list(qs.values_list("pk", flat=True))
        recipient_count = len(customer_ids)
        scheduled_for = ser.validated_data.get("scheduled_for")
        row = CampaignSend.objects.create(
            restaurant=self.restaurant,
            name=name,
            target_type=target,
            message=message,
            recipient_count=recipient_count,
            sent=0,
            failed=0,
            status=CampaignSend.DeliveryStatus.SCHEDULED
            if scheduled_for
            else CampaignSend.DeliveryStatus.PENDING,
            scheduled_for=scheduled_for,
        )
        kwargs = {"eta": scheduled_for} if scheduled_for else {}
        async_result = send_campaign_whatsapp_task.apply_async(
            args=[row.id, self.restaurant.id, customer_ids],
            **kwargs,
        )
        row.queued_task_id = str(async_result.id)
        row.status = (
            CampaignSend.DeliveryStatus.SCHEDULED if scheduled_for else CampaignSend.DeliveryStatus.PENDING
        )
        row.save(update_fields=["queued_task_id", "status"])
        if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
            payload = async_result.get()
            return Response(CampaignSendResponseSerializer(payload).data)
        out = {
            "queued": True,
            "task_id": str(async_result.id),
            "recipient_count": recipient_count,
            "name": name,
            "target_type": target,
        }
        return Response(
            CampaignSendQueuedResponseSerializer(out).data,
            status=status.HTTP_202_ACCEPTED,
        )

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM],
        request=CampaignResendSerializer,
        responses={202: CampaignSendQueuedResponseSerializer},
    )
    @action(detail=True, methods=["post"], url_path="resend")
    def resend(self, request, pk=None):
        source = self.get_object()
        ser = CampaignResendSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        scheduled_for = ser.validated_data.get("scheduled_for")
        clone = CampaignSend.objects.create(
            restaurant=self.restaurant,
            source_campaign=source,
            name=source.name,
            target_type=source.target_type,
            message=source.message,
            recipient_count=0,
            sent=0,
            failed=0,
            status=CampaignSend.DeliveryStatus.SCHEDULED
            if scheduled_for
            else CampaignSend.DeliveryStatus.PENDING,
            scheduled_for=scheduled_for,
        )
        customer_ids = list(customers_for_target(self.restaurant, source.target_type).values_list("pk", flat=True))
        clone.recipient_count = len(customer_ids)
        clone.save(update_fields=["recipient_count"])
        kwargs = {"eta": scheduled_for} if scheduled_for else {}
        async_result = send_campaign_whatsapp_task.apply_async(
            args=[clone.id, self.restaurant.id, customer_ids],
            **kwargs,
        )
        clone.queued_task_id = str(async_result.id)
        clone.save(update_fields=["queued_task_id"])
        out = {
            "queued": True,
            "task_id": str(async_result.id),
            "recipient_count": clone.recipient_count,
            "name": clone.name,
            "target_type": clone.target_type,
        }
        return Response(CampaignSendQueuedResponseSerializer(out).data, status=status.HTTP_202_ACCEPTED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.save(update_fields=["deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["CRM Automations"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(retrieve=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(partial_update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class AutomationRuleViewSet(
    RestaurantScopedMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    GenericViewSet,
):
    permission_classes = [IsStaffUser]
    serializer_class = AutomationRuleSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        defaults = {
            AutomationRule.TriggerType.POSITIVE_FEEDBACK: "Thank you so much! 😊\n\nWe'd love a Google review:\n{{google_review_link}}",
            AutomationRule.TriggerType.NO_VISIT_14_DAYS: "Hey! We miss you 👋\n\nCome back this week for something special 😊",
            AutomationRule.TriggerType.THIRD_VISIT_COMPLETED: "Thank you for visiting us 3 times ❤️\n\nWe're so happy to have you with us!",
        }
        for trigger, template in defaults.items():
            AutomationRule.objects.get_or_create(
                restaurant=self.restaurant,
                trigger_type=trigger,
                defaults={"message_template": template, "enabled": True, "delay_minutes": 0},
            )
        return AutomationRule.objects.filter(restaurant=self.restaurant).order_by("trigger_type")


@extend_schema(tags=["Settings"])
class RestaurantViewSet(
    CRMAuthenticationMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    GenericViewSet,
):
    permission_classes = [IsStaffUser]
    queryset = Restaurant.objects.all().order_by("name")
    lookup_field = "slug"
    serializer_class = RestaurantStaffSerializer
    http_method_names = ["get", "patch", "head", "options"]


@extend_schema(tags=["Settings"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(retrieve=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(create=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(partial_update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(destroy=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class MessageTemplateViewSet(RestaurantScopedMixin, ModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = MessageTemplateSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return MessageTemplate.objects.filter(restaurant=self.restaurant).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(restaurant=self.restaurant)


@extend_schema(tags=["Settings"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class TeamMembershipViewSet(RestaurantScopedMixin, ReadOnlyModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = TeamMemberSerializer

    def get_queryset(self):
        return (
            RestaurantMembership.objects.filter(restaurant=self.restaurant)
            .select_related("user")
            .order_by("user__username", "id")
        )


@extend_schema(tags=["Menu"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(retrieve=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(create=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(partial_update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(destroy=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class MenuCategoryViewSet(RestaurantScopedMixin, ModelViewSet):
    permission_classes = [IsStaffUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        items = MenuItem.objects.order_by("name")
        return (
            MenuCategory.objects.filter(restaurant=self.restaurant)
            .prefetch_related(Prefetch("items", queryset=items))
            .order_by("name")
        )

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return MenuCategoryWriteSerializer
        return MenuCategorySerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["restaurant"] = self.restaurant
        return ctx

    def perform_create(self, serializer):
        serializer.save(restaurant=self.restaurant)


@extend_schema(tags=["Menu"])
@extend_schema_view(list=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(retrieve=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(create=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(partial_update=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
@extend_schema_view(destroy=extend_schema(parameters=[_RESTAURANT_SLUG_PARAM]))
class MenuItemViewSet(RestaurantScopedMixin, ModelViewSet):
    permission_classes = [IsStaffUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return MenuItem.objects.filter(category__restaurant=self.restaurant).select_related(
            "category",
        )

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return MenuItemWriteSerializer
        return MenuItemReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        read_ser = MenuItemReadSerializer(instance, context={"request": request})
        headers = self.get_success_headers(read_ser.data)
        return Response(read_ser.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        read_ser = MenuItemReadSerializer(instance, context={"request": request})
        return Response(read_ser.data)

    def perform_create(self, serializer):
        cat = serializer.validated_data["category"]
        if cat.restaurant_id != self.restaurant.id:
            raise ValidationError({"category": ["Category does not belong to this restaurant."]})
        serializer.save()

    def perform_update(self, serializer):
        cat = serializer.validated_data.get("category", serializer.instance.category)
        if cat.restaurant_id != self.restaurant.id:
            raise ValidationError({"category": ["Category does not belong to this restaurant."]})
        serializer.save()

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM],
        responses={200: OpenApiTypes.OBJECT},
    )
    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        manifest_raw = request.data.get("manifest")
        if manifest_raw in (None, ""):
            raise ValidationError({"manifest": ["Required: JSON array of row objects."]})
        try:
            rows = parse_bulk_manifest(manifest_raw)
        except (json.JSONDecodeError, TypeError) as exc:
            raise ValidationError({"manifest": [str(exc)]}) from exc
        if not isinstance(rows, list):
            raise ValidationError({"manifest": ["Must be a JSON array."]})
        images = request.FILES.getlist("images")
        if len(rows) != len(images):
            raise ValidationError(
                {"images": [f"Expected {len(rows)} file(s) in field 'images', got {len(images)}."]},
            )
        try:
            results = run_menu_bulk_upload(self.restaurant, rows, images)
        except ValueError as exc:
            raise ValidationError({"images": [str(exc)]}) from exc
        return Response({"results": results})


class PublicMenuAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="restaurant_slug",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
            ),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request, restaurant_slug: str | None = None):
        slug = (restaurant_slug or request.query_params.get("restaurant_slug") or "").strip()
        if not slug:
            raise ValidationError({"restaurant_slug": ["This query parameter or URL slug is required."]})
        restaurant = Restaurant.objects.filter(slug=slug).first()
        if not restaurant:
            return Response(status=status.HTTP_404_NOT_FOUND)
        items = MenuItem.objects.order_by("name")
        categories = (
            MenuCategory.objects.filter(restaurant=restaurant)
            .prefetch_related(Prefetch("items", queryset=items))
            .order_by("name")
        )
        data = MenuCategorySerializer(
            categories,
            many=True,
            context={"request": request},
        ).data
        return Response(
            {
                "restaurant": {
                    "slug": restaurant.slug,
                    "name": restaurant.name,
                    "location": restaurant.location,
                    "google_review_link": restaurant.google_review_link or "",
                    "scanner_theme": restaurant.scanner_theme or {},
                },
                "categories": data,
            },
        )

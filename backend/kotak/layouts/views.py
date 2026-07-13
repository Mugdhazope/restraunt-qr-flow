from __future__ import annotations

from django.db.models import F
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from kotak.dashboard.mixins import RestaurantScopedMixin
from kotak.dashboard.permissions import IsStaffUser
from kotak.layouts.defaults import default_layout_for
from kotak.layouts.models import PageKey
from kotak.layouts.models import PageLayout
from kotak.layouts.serializers import PageLayoutListItemSerializer
from kotak.layouts.serializers import PageLayoutSerializer
from kotak.layouts.serializers import PageLayoutWriteSerializer
from kotak.layouts.serializers import PublicPageLayoutSerializer
from kotak.layouts.services import ensure_default_layouts
from kotak.layouts.services import get_or_default_layout
from kotak.layouts.services import reset_layout_to_default
from kotak.layouts.validation import sanitize_layout_for_public
from kotak.restaurants.models import Restaurant

_RESTAURANT_SLUG_PARAM = OpenApiParameter(
    name="restaurant_slug",
    type=str,
    location=OpenApiParameter.QUERY,
    required=True,
)
_PAGE_KEY_PARAM = OpenApiParameter(
    name="page_key",
    type=str,
    location=OpenApiParameter.QUERY,
    required=False,
    enum=[c.value for c in PageKey],
)


@extend_schema(tags=["Layouts"])
class PageLayoutViewSet(RestaurantScopedMixin, ViewSet):
    """Staff layout CRUD: list pages, get/put one page, reset to default."""

    permission_classes = [IsStaffUser]

    @extend_schema(parameters=[_RESTAURANT_SLUG_PARAM], responses={200: PageLayoutListItemSerializer(many=True)})
    def list(self, request):
        ensure_default_layouts(self.restaurant)
        qs = PageLayout.objects.filter(restaurant=self.restaurant).order_by("page_key")
        return Response(PageLayoutListItemSerializer(qs, many=True).data)

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM, _PAGE_KEY_PARAM],
        responses={200: PageLayoutSerializer},
    )
    def retrieve_page(self, request):
        page_key = (request.query_params.get("page_key") or "").strip()
        if not page_key:
            raise ValidationError({"page_key": ["This query parameter is required."]})
        if page_key not in PageKey.values:
            raise ValidationError({"page_key": [f"Invalid page_key: {page_key!r}."]})
        obj = get_or_default_layout(self.restaurant, page_key)
        return Response(PageLayoutSerializer(obj).data)

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM],
        request=PageLayoutWriteSerializer,
        responses={200: PageLayoutSerializer},
    )
    def upsert(self, request):
        ser = PageLayoutWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        page_key = ser.validated_data["page_key"]
        layout = ser.validated_data["layout"]
        schema_version = ser.validated_data["schema_version"]
        expected = ser.validated_data.get("expected_version")

        obj, created = PageLayout.objects.get_or_create(
            restaurant=self.restaurant,
            page_key=page_key,
            defaults={
                "layout": layout,
                "schema_version": schema_version,
                "version": 1,
                "updated_by": request.user if request.user.is_authenticated else None,
            },
        )
        if not created:
            if expected is not None and obj.version != expected:
                return Response(
                    {
                        "detail": "Version conflict.",
                        "current_version": obj.version,
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            obj.layout = layout
            obj.schema_version = schema_version
            obj.updated_by = request.user if request.user.is_authenticated else None
            obj.version = F("version") + 1
            obj.save(
                update_fields=["layout", "schema_version", "updated_by", "version", "updated_at"],
            )
            obj.refresh_from_db()
        return Response(PageLayoutSerializer(obj).data)

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM, _PAGE_KEY_PARAM],
        responses={200: PageLayoutSerializer},
    )
    def reset(self, request):
        page_key = (request.query_params.get("page_key") or "").strip()
        if not page_key:
            raise ValidationError({"page_key": ["This query parameter is required."]})
        if page_key not in PageKey.values:
            raise ValidationError({"page_key": [f"Invalid page_key: {page_key!r}."]})
        obj = reset_layout_to_default(
            self.restaurant,
            page_key,
            user=request.user,
        )
        return Response(PageLayoutSerializer(obj).data)

    @extend_schema(
        parameters=[_RESTAURANT_SLUG_PARAM, _PAGE_KEY_PARAM],
        responses={200: OpenApiTypes.OBJECT},
    )
    def default_template(self, request):
        page_key = (request.query_params.get("page_key") or "").strip()
        if not page_key:
            raise ValidationError({"page_key": ["This query parameter is required."]})
        if page_key not in PageKey.values:
            raise ValidationError({"page_key": [f"Invalid page_key: {page_key!r}."]})
        return Response(default_layout_for(page_key))


class PublicLayoutsAPIView(APIView):
    """Public: all page layouts (or one) for a restaurant slug."""

    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="page_key",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                enum=[c.value for c in PageKey],
            ),
        ],
        responses={200: OpenApiTypes.OBJECT},
    )
    def get(self, request, restaurant_slug: str):
        slug = (restaurant_slug or "").strip()
        restaurant = Restaurant.objects.filter(slug=slug).first()
        if not restaurant:
            return Response(status=status.HTTP_404_NOT_FOUND)

        ensure_default_layouts(restaurant)
        page_key = (request.query_params.get("page_key") or "").strip()
        qs = PageLayout.objects.filter(restaurant=restaurant)
        if page_key:
            if page_key not in PageKey.values:
                raise ValidationError({"page_key": [f"Invalid page_key: {page_key!r}."]})
            qs = qs.filter(page_key=page_key)

        pages = []
        for row in qs.order_by("page_key"):
            data = PublicPageLayoutSerializer(row).data
            data["layout"] = sanitize_layout_for_public(row.layout or {}, page_key=row.page_key)
            pages.append(data)

        return Response(
            {
                "restaurant_slug": restaurant.slug,
                "pages": pages,
            },
        )

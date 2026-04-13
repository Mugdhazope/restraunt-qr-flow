from __future__ import annotations

import logging
from http import HTTPStatus

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import F
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from kotak.accounts.services import OTPRateLimitError
from kotak.accounts.services import OTPService
from kotak.accounts.services import OTPVerificationError
from kotak.customers.models import Customer
from kotak.customers.models import Visit
from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError
from kotak.integrations.whatsapp.exceptions import WhatsAppConfigError
from kotak.integrations.whatsapp.exceptions import WhatsAppError
from kotak.integrations.whatsapp.tasks import send_feedback_message
from kotak.restaurants.models import Restaurant

from .serializers import SendOTPSerializer
from .serializers import VerifyOTPSerializer

logger = logging.getLogger(__name__)


def _create_visit_and_schedule_feedback(
    customer: Customer,
    restaurant: Restaurant,
    *,
    feedback_countdown: int,
) -> Visit:
    """Create a visit, bump visit counters, and queue the WhatsApp rating prompt."""
    visit = Visit.objects.create(customer=customer, restaurant=restaurant)
    now = timezone.now()
    Customer.objects.filter(pk=customer.pk).update(
        total_visits=F("total_visits") + 1,
        last_visit=now,
    )
    logger.info(
        "Visit created",
        extra={
            "visit_id": visit.id,
            "customer_id": customer.id,
            "restaurant_id": restaurant.id,
        },
    )
    send_feedback_message.apply_async(args=[visit.id], countdown=feedback_countdown)
    logger.info(
        "Feedback task scheduled",
        extra={
            "visit_id": visit.id,
            "countdown": feedback_countdown,
        },
    )
    return visit


def _issue_customer_tokens(customer: Customer, restaurant: Restaurant) -> dict[str, str]:
    user_model = get_user_model()
    phone = customer.phone
    username = f"cust_{restaurant.id}_{phone}".replace("+", "")
    auth_user, _ = user_model.objects.get_or_create(
        username=username,
        defaults={
            "email": f"{username}@example.invalid",
            "name": customer.name,
            "is_active": True,
        },
    )
    refresh = RefreshToken.for_user(auth_user)
    refresh["customer_id"] = customer.id
    refresh["restaurant_id"] = restaurant.id
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


@extend_schema(
    tags=["Authentication"],
    request=SendOTPSerializer,
    responses={
        200: inline_serializer(
            name="SendOTPResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
                "existing_user": serializers.BooleanField(required=False),
                "customer_id": serializers.IntegerField(required=False),
                "access": serializers.CharField(required=False),
                "refresh": serializers.CharField(required=False),
            },
        ),
    },
)
class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data["phone"]
        restaurant_slug = serializer.validated_data["restaurant_slug"]
        name = serializer.validated_data.get("name", "").strip()

        restaurant = Restaurant.objects.get(slug=restaurant_slug)
        existing_customer = Customer.objects.filter(phone=phone, restaurant=restaurant).last()
        if existing_customer is not None:
            if name and existing_customer.name != name:
                existing_customer.name = name
                existing_customer.save(update_fields=["name"])
            _create_visit_and_schedule_feedback(
                existing_customer,
                restaurant,
                feedback_countdown=0,
            )
            tokens = _issue_customer_tokens(existing_customer, restaurant)
            return Response(
                {
                    "success": True,
                    "existing_user": True,
                    "message": "Welcome back",
                    "customer_id": existing_customer.id,
                    **tokens,
                },
                status=HTTPStatus.OK,
            )

        otp_service = OTPService()
        try:
            otp_service.send_otp(phone=phone)
        except OTPRateLimitError as exc:
            return Response(
                {"success": False, "message": str(exc)},
                status=HTTPStatus.TOO_MANY_REQUESTS,
            )
        except WhatsAppConfigError as exc:
            logger.warning("send_otp: WhatsApp not configured: %s", exc)
            return Response(
                {
                    "success": False,
                    "message": "WhatsApp is not configured on the server (missing token or phone number ID).",
                },
                status=HTTPStatus.SERVICE_UNAVAILABLE,
            )
        except WhatsAppAPIError as exc:
            if exc.is_access_token_error:
                logger.warning("send_otp: WhatsApp access token invalid or expired: %s", exc)
                return Response(
                    {
                        "success": False,
                        "message": (
                            "WhatsApp access token has expired or is invalid. "
                            "Create a new token in Meta (App → WhatsApp → API Setup, or System User token) "
                            "and update WHATSAPP_ACCESS_TOKEN in your environment."
                        ),
                    },
                    status=HTTPStatus.SERVICE_UNAVAILABLE,
                )
            if exc.is_recipient_not_in_allowed_list:
                logger.warning(
                    "send_otp: WhatsApp recipient not on Meta allowlist (code 131030): %s",
                    exc,
                )
                return Response(
                    {
                        "success": False,
                        "message": (
                            "This number cannot receive messages from this WhatsApp app yet. "
                            "In Meta: App → WhatsApp → API Setup, add the phone number to the "
                            "recipient / “send test message” list (required while the app is in Development), "
                            "or complete App Review and go Live for open messaging."
                        ),
                    },
                    status=HTTPStatus.BAD_REQUEST,
                )
            logger.exception("send_otp: WhatsApp API failed", exc_info=exc)
            return Response(
                {
                    "success": False,
                    "message": "Unable to send OTP via WhatsApp at the moment.",
                },
                status=HTTPStatus.BAD_GATEWAY,
            )
        except WhatsAppError as exc:
            logger.exception("send_otp: unexpected WhatsApp error", exc_info=exc)
            return Response(
                {
                    "success": False,
                    "message": "Unable to send OTP via WhatsApp at the moment.",
                },
                status=HTTPStatus.BAD_GATEWAY,
            )

        return Response(
            {
                "success": True,
                "existing_user": False,
                "message": "OTP sent via WhatsApp",
            },
            status=HTTPStatus.OK,
        )


@extend_schema(
    tags=["Authentication"],
    request=VerifyOTPSerializer,
    responses={
        200: inline_serializer(
            name="VerifyOTPResponse",
            fields={
                "success": serializers.BooleanField(),
                "customer_id": serializers.IntegerField(),
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
            },
        ),
    },
)
class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        restaurant_slug = serializer.validated_data["restaurant_slug"]
        phone = serializer.validated_data["phone"]
        otp_code = serializer.validated_data["otp"]
        name = serializer.validated_data.get("name", "").strip()

        otp_service = OTPService()
        try:
            otp_service.verify_otp(phone=phone, code=otp_code)
        except OTPRateLimitError as exc:
            return Response(
                {"success": False, "message": str(exc)},
                status=HTTPStatus.TOO_MANY_REQUESTS,
            )
        except OTPVerificationError as exc:
            return Response(
                {"success": False, "message": str(exc)},
                status=HTTPStatus.BAD_REQUEST,
            )

        restaurant = Restaurant.objects.get(slug=restaurant_slug)
        customer, created = Customer.objects.get_or_create(
            restaurant=restaurant,
            phone=phone,
            defaults={"name": name or f"Guest {phone[-4:]}"},
        )
        if name and not created and customer.name != name:
            customer.name = name
            customer.save(update_fields=["name"])

        _create_visit_and_schedule_feedback(
            customer,
            restaurant,
            feedback_countdown=settings.FEEDBACK_PROMPT_DELAY_SECONDS,
        )
        tokens = _issue_customer_tokens(customer, restaurant)

        return Response(
            {
                "success": True,
                "customer_id": customer.id,
                **tokens,
            },
            status=HTTPStatus.OK,
        )

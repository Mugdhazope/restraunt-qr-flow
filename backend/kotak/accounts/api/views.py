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
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from kotak.accounts.services import OTPDeliveryConfigError
from kotak.accounts.services import OTPRateLimitError
from kotak.accounts.services import OTPService
from kotak.accounts.services import OTPVerificationError
from kotak.customers.models import Customer
from kotak.customers.models import CustomerTag
from kotak.customers.models import Visit

# WA_DISABLED — re-enable when WhatsApp automations / feedback are turned back on
# from kotak.dashboard.services.automations import get_or_create_rule
# from kotak.dashboard.tasks import send_automation_message_task
from kotak.integrations.sms.exceptions import SMSAPIError
from kotak.integrations.sms.exceptions import SMSConfigError
from kotak.integrations.whatsapp.exceptions import WhatsAppAPIError
from kotak.integrations.whatsapp.exceptions import WhatsAppError

# WA_DISABLED
# from kotak.integrations.whatsapp.tasks import send_feedback_message
from kotak.restaurants.models import Restaurant

from .serializers import SendOTPSerializer
from .serializers import VerifyOTPSerializer

logger = logging.getLogger(__name__)


class _NoopCeleryTask:
    """Stub so patches/tests can reference apply_async while WA scheduling is off."""

    @staticmethod
    def apply_async(*_args, **_kwargs):
        return None


# WA_DISABLED — real task: kotak.integrations.whatsapp.tasks.send_feedback_message
send_feedback_message = _NoopCeleryTask()


def _create_visit_and_schedule_feedback(
    customer: Customer,
    restaurant: Restaurant,
    *,
    feedback_countdown: int,
) -> Visit:
    """Create a visit and bump visit counters.

    WhatsApp feedback / automation scheduling is disabled for QR-menu-only mode.
    Re-enable the commented blocks when WhatsApp is turned back on.
    """
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
    # WA_DISABLED — re-enable WhatsApp post-visit feedback prompt
    # send_feedback_message.apply_async(args=[visit.id], countdown=feedback_countdown)
    _ = feedback_countdown  # kept for API compatibility when WA is re-enabled
    customer.refresh_from_db(fields=["total_visits", "tag"])
    if customer.total_visits >= 2 and customer.tag == CustomerTag.FIRST_TIME:
        Customer.objects.filter(pk=customer.pk, tag=CustomerTag.FIRST_TIME).update(
            tag=CustomerTag.NEUTRAL,
        )
        customer.refresh_from_db(fields=["tag"])
    # WA_DISABLED — re-enable third-visit WhatsApp automation
    # if customer.total_visits == 3:
    #     rule = get_or_create_rule(
    #         restaurant,
    #         "third_visit_completed",
    #     )
    #     if rule.enabled:
    #         send_automation_message_task.apply_async(
    #             args=[restaurant.id, customer.phone, "third_visit_completed"],
    #             countdown=rule.delay_minutes * 60,
    #         )
    logger.info(
        "Visit recorded (WhatsApp feedback scheduling disabled)",
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
                "total_visits": serializers.IntegerField(required=False),
                "delivery_channel": serializers.ChoiceField(
                    choices=["sms", "whatsapp"],
                    required=False,
                ),
            },
        ),
    },
)
class SendOTPView(APIView):
    """Public; skip global JWT so a stale Swagger ``Bearer`` header does not 403."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data["phone"]
        restaurant_slug = serializer.validated_data["restaurant_slug"]
        name = serializer.validated_data.get("name", "").strip()

        restaurant = Restaurant.objects.get(slug=restaurant_slug)
        existing_customer = Customer.objects.filter(phone=phone, restaurant=restaurant).last()
        if existing_customer is not None and existing_customer.phone_verified:
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
                    "total_visits": existing_customer.total_visits,
                    **tokens,
                },
                status=HTTPStatus.OK,
            )

        otp_service = OTPService()
        try:
            channel = otp_service.send_otp(phone=phone, restaurant=restaurant)
        except OTPRateLimitError as exc:
            return Response(
                {"success": False, "message": str(exc)},
                status=HTTPStatus.TOO_MANY_REQUESTS,
            )
        except OTPDeliveryConfigError as exc:
            logger.warning("send_otp: no delivery channel: %s", exc)
            return Response(
                {"success": False, "message": str(exc)},
                status=HTTPStatus.SERVICE_UNAVAILABLE,
            )
        except SMSConfigError as exc:
            logger.warning("send_otp: SMS not configured: %s", exc)
            return Response(
                {
                    "success": False,
                    "message": (
                        "SMS OTP is not configured. Set SMS_API_KEY, SMS_SENDER_ID, "
                        "and SMS_TEMPLATE_ID in the environment (or use WhatsApp OTP template in Settings)."
                    ),
                },
                status=HTTPStatus.SERVICE_UNAVAILABLE,
            )
        except SMSAPIError as exc:
            logger.warning("send_otp: SMS API failed: %s", exc, exc_info=True)
            return Response(
                {
                    "success": False,
                    "message": "Unable to send OTP over SMS right now. Please try again shortly.",
                },
                status=HTTPStatus.BAD_GATEWAY,
            )
        except WhatsAppError as exc:
            msg = exc.user_message() if isinstance(exc, WhatsAppAPIError) else str(exc)
            logger.warning("send_otp: WhatsApp OTP failed: %s", exc, exc_info=True)
            return Response(
                {"success": False, "message": msg},
                status=HTTPStatus.BAD_GATEWAY,
            )

        label = "SMS" if channel == "sms" else "WhatsApp"
        return Response(
            {
                "success": True,
                "existing_user": False,
                "message": f"OTP sent via {label}",
                "delivery_channel": channel,
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
                "total_visits": serializers.IntegerField(),
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
            },
        ),
    },
)
class VerifyOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        restaurant_slug = serializer.validated_data["restaurant_slug"]
        phone = serializer.validated_data["phone"]
        otp_code = serializer.validated_data["otp"]
        name = serializer.validated_data.get("name", "").strip()
        restaurant = Restaurant.objects.get(slug=restaurant_slug)

        otp_service = OTPService()
        try:
            otp_service.verify_otp(phone=phone, code=otp_code, restaurant=restaurant)
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

        customer, created = Customer.objects.get_or_create(
            restaurant=restaurant,
            phone=phone,
            defaults={
                "name": name or f"Guest {phone[-4:]}",
                "phone_verified": True,
                "otp_verified_at": timezone.now(),
            },
        )
        updates: list[str] = []
        if name and customer.name != name:
            customer.name = name
            updates.append("name")
        if not customer.phone_verified:
            customer.phone_verified = True
            updates.append("phone_verified")
        customer.otp_verified_at = timezone.now()
        updates.append("otp_verified_at")
        if updates:
            customer.save(update_fields=updates)

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
                "total_visits": customer.total_visits,
                **tokens,
            },
            status=HTTPStatus.OK,
        )


class CheckInAnonThrottle(AnonRateThrottle):
    """Per-IP limit for public check-in (no OTP) to blunt spam."""

    scope = "check_in"


@extend_schema(
    tags=["Authentication"],
    request=SendOTPSerializer,
    responses={
        200: inline_serializer(
            name="CheckInResponse",
            fields={
                "success": serializers.BooleanField(),
                "customer_id": serializers.IntegerField(),
                "existing_user": serializers.BooleanField(required=False),
                "total_visits": serializers.IntegerField(),
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
            },
        ),
    },
)
class CheckInView(APIView):
    """Public check-in without OTP: create/update customer, record visit, issue JWT."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [CheckInAnonThrottle]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data["phone"]
        restaurant_slug = serializer.validated_data["restaurant_slug"]
        name = serializer.validated_data.get("name", "").strip()
        restaurant = Restaurant.objects.get(slug=restaurant_slug)

        prior = Customer.objects.filter(phone=phone, restaurant=restaurant).last()
        was_verified_before = prior is not None and prior.phone_verified

        customer, _created = Customer.objects.get_or_create(
            restaurant=restaurant,
            phone=phone,
            defaults={
                "name": name or f"Guest {phone[-4:]}",
                "phone_verified": True,
                "otp_verified_at": timezone.now(),
            },
        )
        updates: list[str] = []
        if name and customer.name != name:
            customer.name = name
            updates.append("name")
        if not customer.phone_verified:
            customer.phone_verified = True
            updates.append("phone_verified")
        customer.otp_verified_at = timezone.now()
        updates.append("otp_verified_at")
        if updates:
            customer.save(update_fields=updates)

        feedback_countdown = settings.FEEDBACK_PROMPT_DELAY_SECONDS
        _create_visit_and_schedule_feedback(
            customer,
            restaurant,
            feedback_countdown=feedback_countdown,
        )
        tokens = _issue_customer_tokens(customer, restaurant)

        return Response(
            {
                "success": True,
                "customer_id": customer.id,
                "existing_user": was_verified_before,
                "total_visits": customer.total_visits,
                **tokens,
            },
            status=HTTPStatus.OK,
        )


@extend_schema(
    tags=["Authentication"],
    request=SendOTPSerializer,
    responses={
        200: inline_serializer(
            name="ResendOTPResponse",
            fields={
                "success": serializers.BooleanField(),
                "message": serializers.CharField(),
                "delivery_channel": serializers.ChoiceField(
                    choices=["sms", "whatsapp"],
                    required=False,
                ),
            },
        ),
    },
)
class ResendOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data["phone"]
        restaurant_slug = serializer.validated_data["restaurant_slug"]
        restaurant = Restaurant.objects.get(slug=restaurant_slug)

        existing_customer = Customer.objects.filter(phone=phone, restaurant=restaurant).last()
        if existing_customer is not None and existing_customer.phone_verified:
            return Response(
                {
                    "success": True,
                    "message": "Phone already verified. OTP not required.",
                },
                status=HTTPStatus.OK,
            )

        try:
            channel = OTPService().send_otp(phone=phone, restaurant=restaurant)
        except OTPRateLimitError as exc:
            return Response(
                {"success": False, "message": str(exc)},
                status=HTTPStatus.TOO_MANY_REQUESTS,
            )
        except OTPDeliveryConfigError as exc:
            return Response(
                {"success": False, "message": str(exc)},
                status=HTTPStatus.SERVICE_UNAVAILABLE,
            )
        except SMSConfigError:
            return Response(
                {
                    "success": False,
                    "message": "SMS OTP is not configured. Contact support.",
                },
                status=HTTPStatus.SERVICE_UNAVAILABLE,
            )
        except SMSAPIError:
            return Response(
                {
                    "success": False,
                    "message": "Unable to resend OTP over SMS right now.",
                },
                status=HTTPStatus.BAD_GATEWAY,
            )
        except WhatsAppError as exc:
            msg = exc.user_message() if isinstance(exc, WhatsAppAPIError) else str(exc)
            return Response(
                {"success": False, "message": msg},
                status=HTTPStatus.BAD_GATEWAY,
            )

        label = "SMS" if channel == "sms" else "WhatsApp"
        return Response(
            {
                "success": True,
                "message": f"OTP resent via {label}",
                "delivery_channel": channel,
            },
            status=HTTPStatus.OK,
        )

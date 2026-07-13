from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import inline_serializer
from rest_framework import serializers
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ObtainAuthTokenView(ObtainAuthToken):
    """Token login must ignore session auth.

    Browser often already has a Django ``sessionid`` (admin / prior visit).
    Default ``SessionAuthentication`` then enforces CSRF and returns 403
    ``CSRF Failed: CSRF token missing`` on SPA login without ``X-CSRFToken``.
    """

    authentication_classes = ()
    permission_classes = (AllowAny,)

    @extend_schema(
        tags=["Authentication"],
        summary="Obtain API token",
        description=(
            "Send your **username** and **password** to receive an API token. "
            "Use the header `Authorization: Token <token>` on subsequent requests."
        ),
        request=AuthTokenSerializer,
        responses={
            200: inline_serializer(
                name="AuthTokenResponse",
                fields={
                    "token": serializers.CharField(
                        help_text="Token string to send in the Authorization header."
                    )
                },
            )
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Authentication"],
        summary="Revoke API token",
        description="Deletes the caller's DRF token so it can no longer be used.",
        responses={204: None},
    )
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

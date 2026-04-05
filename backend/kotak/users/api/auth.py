from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import inline_serializer
from rest_framework import serializers
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.authtoken.views import ObtainAuthToken


class ObtainAuthTokenView(ObtainAuthToken):
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

from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import extend_schema_view
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.mixins import UpdateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from kotak.users.models import User

from .serializers import UserSerializer


@extend_schema(tags=["Users"])
@extend_schema_view(
    list=extend_schema(
        summary="List current user",
        description="Returns the authenticated user as a single-item list (same as your account).",
    ),
    retrieve=extend_schema(
        summary="Retrieve user by username",
        description="Fetch a user profile. You can only access your own username.",
    ),
    update=extend_schema(
        summary="Update user (full)",
        description="Replace profile fields for the current user.",
    ),
    partial_update=extend_schema(
        summary="Update user (partial)",
        description="Patch profile fields for the current user.",
    ),
)
class UserViewSet(RetrieveModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    lookup_field = "username"

    def get_queryset(self, *args, **kwargs):
        assert isinstance(self.request.user.id, int)
        return self.queryset.filter(id=self.request.user.id)

    @extend_schema(
        summary="Current user profile",
        description="Convenience endpoint returning the same payload as retrieving your user by username.",
    )
    @action(detail=False)
    def me(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(status=status.HTTP_200_OK, data=serializer.data)

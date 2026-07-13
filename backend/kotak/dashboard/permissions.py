from __future__ import annotations

from django.conf import settings
from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """Staff only, unless ``CRM_OPEN_PERMISSIONS`` (local settings) is true."""

    def has_permission(self, request, view):
        if getattr(settings, "CRM_OPEN_PERMISSIONS", False):
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)

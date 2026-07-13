"""Expose CSRF token for SPA clients when the cookie is HTTP-only."""

from __future__ import annotations

from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    """GET returns ``csrfToken`` for the ``X-CSRFToken`` header on mutating requests."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # DRF wraps HttpRequest; get_token needs the WSGI request for CSRF cookie/META.
        return Response({"csrfToken": get_token(request._request)})  # noqa: SLF001

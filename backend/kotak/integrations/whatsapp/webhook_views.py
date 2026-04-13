from __future__ import annotations

import json
import logging

from django.conf import settings
from django.http import HttpResponse
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from .parsers import parse_rating_webhook_payload
from .webhook_services import WhatsAppWebhookService

logger = logging.getLogger(__name__)

_RAW_BODY_LOG_LIMIT = 8000


@method_decorator(csrf_exempt, name="dispatch")
class WhatsAppWebhookView(View):
    service_class = WhatsAppWebhookService

    def get(self, request):
        mode = request.GET.get("hub.mode")
        verify_token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge")

        if (
            mode == "subscribe"
            and verify_token
            and verify_token == settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN
            and challenge
        ):
            return HttpResponse(challenge, status=200, content_type="text/plain")

        return HttpResponse("Forbidden", status=403)

    def post(self, request):
        raw = request.body
        try:
            decoded = raw.decode("utf-8")
        except UnicodeDecodeError:
            decoded = ""

        preview = decoded[:_RAW_BODY_LOG_LIMIT] if decoded else repr(raw[:_RAW_BODY_LOG_LIMIT])
        logger.info(
            "whatsapp_webhook_post_received bytes=%s preview=%s",
            len(raw),
            preview,
        )

        try:
            payload = json.loads(decoded) if decoded else {}
        except ValueError:
            payload = {}

        parsed = parse_rating_webhook_payload(payload)
        logger.info("whatsapp_webhook_parsed parsed=%s", parsed)
        if parsed is None and isinstance(payload, dict) and payload.get("entry"):
            logger.warning(
                "whatsapp_webhook_no_inbound_message_parsed "
                "(check Meta callback URL is public HTTPS, subscribed to messages, "
                "and verify_token matches WHATSAPP_WEBHOOK_VERIFY_TOKEN)",
                extra={"object": payload.get("object")},
            )

        service = self.service_class()
        try:
            outcome = service.process_inbound_message(parsed)
            logger.info("whatsapp_webhook_processed outcome=%s", outcome)
        except Exception:
            logger.exception("whatsapp_webhook_process_failed")
        return JsonResponse({"success": True}, status=200)

# ruff: noqa: TRY003, EM101, E501
from __future__ import annotations

import logging
import re

import requests
from django.conf import settings

from .exceptions import WhatsAppAPIError
from .exceptions import WhatsAppConfigError

logger = logging.getLogger(__name__)


def _graph_api_recipient_phone(to: str) -> str:
    """Normalize recipient for WhatsApp Cloud API (digits only, country code, no +)."""
    raw = (to or "").strip()
    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        return ""

    if digits.startswith("00"):
        digits = digits[2:]

    default_cc = "".join(
        ch for ch in (getattr(settings, "WHATSAPP_DEFAULT_COUNTRY_CODE", "") or "") if ch.isdigit()
    )
    if default_cc:
        # Common local formats in CRM data (India-first default): 10 digits, or 0-prefixed 11 digits.
        if len(digits) == 10:
            return f"{default_cc}{digits}"
        if len(digits) == 11 and digits.startswith("0"):
            return f"{default_cc}{digits[1:]}"

    return digits


_ws_run = re.compile(r"\s+")


def sanitize_template_parameter_text(value: str) -> str:
    """Meta rejects template param text with newlines/tabs or more than 4 consecutive spaces."""
    s = (value or "").strip()
    if not s:
        return ""
    return _ws_run.sub(" ", s)


def _meta_error_fields(response: requests.Response) -> tuple[int | None, int | None]:
    try:
        data = response.json()
    except ValueError:
        return None, None
    err = data.get("error")
    if not isinstance(err, dict):
        return None, None
    code = err.get("code")
    sub = err.get("error_subcode")
    meta_code = int(code) if isinstance(code, int) else None
    meta_subcode = int(sub) if isinstance(sub, int) else None
    return meta_code, meta_subcode


class WhatsAppClient:
    TIMEOUT_SECONDS = 10

    @staticmethod
    def _graph_base_url() -> str:
        ver = settings.WHATSAPP_GRAPH_API_VERSION
        return f"https://graph.facebook.com/{ver}"

    def __init__(self, *, access_token: str | None = None, phone_number_id: str | None = None):
        self.access_token = access_token or settings.WHATSAPP_ACCESS_TOKEN
        self.phone_number_id = phone_number_id or settings.WHATSAPP_PHONE_NUMBER_ID
        if not self.access_token or not self.phone_number_id:
            raise WhatsAppConfigError("WhatsApp access token or phone number ID is not configured")

    def _post_messages(self, to_for_logs: str, payload: dict) -> dict:
        recipient = payload.get("to")
        if not recipient:
            logger.error("WhatsApp send: missing to", extra={"phone": to_for_logs})
            raise WhatsAppAPIError("Invalid recipient phone for WhatsApp API")

        url = f"{self._graph_base_url()}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=self.TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            logger.exception(
                "WhatsApp request failed phone=%s recipient=%s",
                to_for_logs,
                recipient,
            )
            raise WhatsAppAPIError("Failed to call WhatsApp API") from exc

        if not response.ok:
            snippet = response.text[:500]
            meta_code, meta_subcode = _meta_error_fields(response)
            logger.error(
                "WhatsApp API error status=%s phone=%s recipient=%s body=%s",
                response.status_code,
                to_for_logs,
                recipient,
                snippet,
            )
            raise WhatsAppAPIError(
                "WhatsApp API request failed",
                http_status=response.status_code,
                meta_code=meta_code,
                meta_subcode=meta_subcode,
            )

        try:
            return response.json()
        except ValueError as exc:
            logger.exception(
                "WhatsApp API returned invalid JSON phone=%s body=%s",
                to_for_logs,
                response.text[:500],
            )
            raise WhatsAppAPIError("Invalid WhatsApp API response") from exc

    def send_text_message(self, to: str, message: str) -> dict:
        recipient = _graph_api_recipient_phone(to)
        if not recipient:
            logger.error("WhatsApp send: empty recipient after normalizing phone", extra={"phone": to})
            raise WhatsAppAPIError("Invalid recipient phone for WhatsApp API")

        payload = {
            "messaging_product": "whatsapp",
            "to": recipient,
            "type": "text",
            "text": {"body": message},
        }
        return self._post_messages(to, payload)

    def send_template_message(
        self,
        to: str,
        *,
        template_name: str,
        language_code: str,
        body_parameters: list[str],
    ) -> dict:
        """Send an approved template; ``body_parameters`` map to {{1}}, {{2}}, … in template body."""
        recipient = _graph_api_recipient_phone(to)
        if not recipient:
            logger.error("WhatsApp template: empty recipient", extra={"phone": to})
            raise WhatsAppAPIError("Invalid recipient phone for WhatsApp API")

        name = (template_name or "").strip()
        if not name:
            raise WhatsAppAPIError("Template name is required")

        lang = (language_code or "en").strip() or "en"
        template_obj: dict = {
            "name": name,
            "language": {"code": lang},
        }
        if body_parameters:
            template_obj["components"] = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": sanitize_template_parameter_text(str(p))}
                        for p in body_parameters
                    ],
                },
            ]

        payload = {
            "messaging_product": "whatsapp",
            "to": recipient,
            "type": "template",
            "template": template_obj,
        }
        return self._post_messages(to, payload)

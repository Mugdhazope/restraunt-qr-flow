# ruff: noqa: TRY003, EM101, E501
from __future__ import annotations

import logging

import requests
from django.conf import settings

from .exceptions import WhatsAppAPIError
from .exceptions import WhatsAppConfigError

logger = logging.getLogger(__name__)


def _graph_api_recipient_phone(to: str) -> str:
    """WhatsApp Cloud API expects the recipient as digits only (country code, no +)."""
    return "".join(ch for ch in to if ch.isdigit())


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

    def send_text_message(self, to: str, message: str) -> dict:
        recipient = _graph_api_recipient_phone(to)
        if not recipient:
            logger.error("WhatsApp send: empty recipient after normalizing phone", extra={"phone": to})
            raise WhatsAppAPIError("Invalid recipient phone for WhatsApp API")

        url = f"{self._graph_base_url()}/{self.phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient,
            "type": "text",
            "text": {"body": message},
        }
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
                to,
                recipient,
            )
            raise WhatsAppAPIError("Failed to call WhatsApp API") from exc

        if not response.ok:
            snippet = response.text[:500]
            meta_code, meta_subcode = _meta_error_fields(response)
            logger.error(
                "WhatsApp API error status=%s phone=%s recipient=%s body=%s",
                response.status_code,
                to,
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
                to,
                response.text[:500],
            )
            raise WhatsAppAPIError("Invalid WhatsApp API response") from exc

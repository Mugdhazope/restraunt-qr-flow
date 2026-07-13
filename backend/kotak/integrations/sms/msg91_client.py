from __future__ import annotations

import logging

import requests
from django.conf import settings

from .exceptions import SMSAPIError
from .exceptions import SMSConfigError

logger = logging.getLogger(__name__)


def _msg91_mobile(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if not digits:
        return ""
    # MSG91 expects country-code-prefixed mobile without "+".
    if len(digits) == 10:
        return f"91{digits}"
    if len(digits) == 11 and digits.startswith("0"):
        return f"91{digits[1:]}"
    return digits


class MSG91Client:
    TIMEOUT_SECONDS = 10
    ENDPOINT = "https://control.msg91.com/api/v5/otp"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        sender_id: str | None = None,
        template_id: str | None = None,
    ):
        self.api_key = (api_key or settings.SMS_API_KEY or "").strip()
        self.sender_id = (sender_id or settings.SMS_SENDER_ID or "").strip()
        self.template_id = (template_id or settings.SMS_TEMPLATE_ID or "").strip()
        if not self.api_key:
            raise SMSConfigError("SMS_API_KEY is not configured")
        if not self.sender_id:
            raise SMSConfigError("SMS_SENDER_ID is not configured")
        if not self.template_id:
            raise SMSConfigError("SMS_TEMPLATE_ID is not configured")

    def send_otp(self, *, phone: str, otp_code: str) -> dict:
        mobile = _msg91_mobile(phone)
        if not mobile:
            raise SMSAPIError("Invalid phone number for SMS")

        payload = {
            "mobile": mobile,
            "otp": str(otp_code),
            "template_id": self.template_id,
            "otp_length": 6,
            "sender": self.sender_id,
        }
        headers = {
            "authkey": self.api_key,
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                self.ENDPOINT,
                json=payload,
                headers=headers,
                timeout=self.TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            logger.exception("msg91_send_otp_request_failed phone=%s", phone)
            raise SMSAPIError("Failed to call SMS provider") from exc

        if not response.ok:
            logger.error(
                "msg91_send_otp_http_error status=%s phone=%s body=%s",
                response.status_code,
                phone,
                response.text[:500],
            )
            raise SMSAPIError("SMS provider request failed")

        try:
            data = response.json()
        except ValueError as exc:
            logger.exception("msg91_send_otp_invalid_json phone=%s", phone)
            raise SMSAPIError("Invalid SMS provider response") from exc

        if not isinstance(data, dict):
            raise SMSAPIError("Invalid SMS provider response shape")

        # MSG91 often returns HTTP 200 with {"type":"error","message":"..."} when the SMS was not sent.
        msg_type = str(data.get("type") or "").strip().lower()
        if msg_type == "error":
            detail = (
                data.get("message")
                or data.get("msg")
                or data.get("error")
                or "MSG91 rejected the request (check auth key, template id, sender, DLT)."
            )
            if isinstance(detail, dict):
                detail = str(detail)
            detail = str(detail).strip() or "Unknown MSG91 error"
            logger.error(
                "msg91_send_otp_business_error phone=%s detail=%s raw=%s",
                phone,
                detail[:300],
                str(data)[:500],
            )
            raise SMSAPIError(f"SMS not sent: {detail}")

        logger.info(
            "msg91_send_otp_ok phone=%s type=%s",
            phone,
            msg_type or "unknown",
            extra={"msg91_response_keys": list(data.keys())},
        )
        return data

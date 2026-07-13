from __future__ import annotations

from .msg91_client import MSG91Client


class SMSService:
    def __init__(
        self,
        client: MSG91Client | None = None,
        *,
        api_key: str | None = None,
        sender_id: str | None = None,
        template_id: str | None = None,
    ):
        self.client = client or MSG91Client(
            api_key=api_key,
            sender_id=sender_id,
            template_id=template_id,
        )

    def send_otp(self, *, phone: str, otp_code: str) -> dict:
        return self.client.send_otp(phone=phone, otp_code=otp_code)

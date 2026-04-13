from __future__ import annotations

from .client import WhatsAppClient


class WhatsAppService:
    def __init__(self, client: WhatsAppClient | None = None):
        self.client = client or WhatsAppClient()

    def send_text(self, phone: str, message: str) -> dict:
        return self.client.send_text_message(to=phone, message=message)

    def send_otp(self, phone: str, otp_code: str) -> dict:
        """Plain ``type: text`` session message (Meta API Setup uses templates, e.g. hello_world).

        In Development, add the recipient under WhatsApp → API Setup. For cold outbound text,
        Meta may require an open 24h conversation window (user messages your business number
        first) or an approved authentication template—see Cloud API messaging rules.
        """
        otp_message = f"Your OTP for login is {otp_code}. Valid for 5 minutes."
        return self.send_text(phone=phone, message=otp_message)

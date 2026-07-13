from __future__ import annotations

from .client import WhatsAppClient
from .exceptions import WhatsAppOTPConfigError


class WhatsAppService:
    def __init__(self, client: WhatsAppClient | None = None):
        self.client = client or WhatsAppClient()

    def send_text(self, phone: str, message: str) -> dict:
        return self.client.send_text_message(to=phone, message=message)

    def send_template(
        self,
        phone: str,
        *,
        template_name: str,
        language_code: str,
        body_parameters: list[str],
    ) -> dict:
        return self.client.send_template_message(
            phone,
            template_name=template_name,
            language_code=language_code,
            body_parameters=body_parameters,
        )

    def send_otp(
        self,
        phone: str,
        otp_code: str,
        *,
        template_name: str | None = None,
        language_code: str = "en",
    ) -> dict:
        """Send OTP via an approved Meta template (works outside the 24-hour session window)."""
        name = (template_name or "").strip()
        if not name:
            raise WhatsAppOTPConfigError(
                "WhatsApp OTP needs an approved template whose body has one variable {{1}} for "
                "the code. In WhatsApp Manager create it (e.g. Authentication), then set "
                "Dashboard → Settings → WhatsApp OTP template name and language, or "
                "WHATSAPP_OTP_TEMPLATE_NAME and WHATSAPP_OTP_TEMPLATE_LANGUAGE in the environment. "
                "Plain session text is blocked by Meta when the customer has not messaged you "
                "within the last 24 hours (error 131047).",
            )
        lang = (language_code or "en").strip() or "en"
        return self.send_template(
            phone,
            template_name=name,
            language_code=lang,
            body_parameters=[otp_code],
        )

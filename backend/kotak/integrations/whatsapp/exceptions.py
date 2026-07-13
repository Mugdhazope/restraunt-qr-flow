class WhatsAppError(Exception):
    """Base exception for WhatsApp integration errors."""


class WhatsAppConfigError(WhatsAppError):
    """Raised when WhatsApp credentials are not configured."""


class WhatsAppOTPConfigError(WhatsAppError):
    """Raised when OTP is requested but no Meta template is configured (required outside the 24h session)."""


_HTTP_UNAUTHORIZED = 401
_HTTP_FORBIDDEN = 403
_META_OAUTH_TOKEN_INVALID = 190
_META_RECIPIENT_NOT_ALLOWED_DEV = 131030
# Session message outside 24h customer care window (marketing requires a template).
_META_OUTSIDE_24H_SESSION = 131047
_META_TEMPLATE_TRANSLATION_MISSING = 132001


class WhatsAppAPIError(WhatsAppError):
    """Raised when Meta Graph API calls fail."""

    def __init__(
        self,
        message: str,
        *,
        http_status: int | None = None,
        meta_code: int | None = None,
        meta_subcode: int | None = None,
    ) -> None:
        super().__init__(message)
        self.http_status = http_status
        self.meta_code = meta_code
        self.meta_subcode = meta_subcode

    @property
    def is_access_token_error(self) -> bool:
        """OAuth / expired or invalid user access token (Meta code 190) or HTTP 401."""
        if self.http_status == _HTTP_UNAUTHORIZED:
            return True
        return self.meta_code == _META_OAUTH_TOKEN_INVALID

    @property
    def is_recipient_not_in_allowed_list(self) -> bool:
        """True when Meta rejects recipient (e.g. dev mode test list, code 131030)."""
        return self.meta_code == _META_RECIPIENT_NOT_ALLOWED_DEV

    def user_message(self) -> str:
        """Short message for CRM UI / API responses (avoid raw Graph error blobs)."""
        if self.is_access_token_error:
            return (
                "WhatsApp access token expired or invalid. In Meta for Developers, "
                "generate a new WhatsApp access token, then update Restaurant → "
                "WhatsApp API token (or WHATSAPP_ACCESS_TOKEN for the default app "
                "credential)."
            )
        if self.is_recipient_not_in_allowed_list:
            return (
                "This phone number is not allowed for messaging in development. "
                "Add it under Meta → WhatsApp → API setup (recipient / test numbers)."
            )
        if self.http_status == _HTTP_FORBIDDEN:
            return (
                "WhatsApp API denied the request (403). Confirm the token has "
                "messaging permissions and matches the Phone number ID."
            )
        if self.meta_code == _META_TEMPLATE_TRANSLATION_MISSING:
            return (
                "The configured WhatsApp template/language pair is invalid. "
                "In Settings -> WhatsApp Integration, ensure the campaign template "
                "name matches Meta exactly and the language code exists for that template "
                "(e.g. en or en_US)."
            )
        if self.meta_code == _META_OUTSIDE_24H_SESSION:
            return (
                "WhatsApp blocked plain text: no recent customer reply. "
                "Set an approved campaign template in Dashboard -> Settings "
                "(WhatsApp campaign template), or ask the customer to message your business first."
            )
        return self.args[0] if self.args else "WhatsApp API request failed"


def meta_outbound_delivery_hint(meta_code: int | None) -> str | None:
    """Human hint for Meta message status error codes (webhooks / async failures)."""
    if meta_code == _META_OUTSIDE_24H_SESSION:
        return (
            "Outside WhatsApp's 24-hour window: the customer has not messaged you "
            "recently, so free-form text cannot be delivered. Use an approved "
            "template, or they must reply to your business number first."
        )
    if meta_code == _META_RECIPIENT_NOT_ALLOWED_DEV:
        return (
            "Recipient not allowed in development mode—add the number under Meta "
            "WhatsApp API setup (test users)."
        )
    return None

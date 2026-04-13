class WhatsAppError(Exception):
    """Base exception for WhatsApp integration errors."""


class WhatsAppConfigError(WhatsAppError):
    """Raised when WhatsApp credentials are not configured."""


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
        if self.http_status == 401:
            return True
        return self.meta_code == 190

    @property
    def is_recipient_not_in_allowed_list(self) -> bool:
        """Development mode: recipient must be added under WhatsApp → API Setup (Meta code 131030)."""
        return self.meta_code == 131030

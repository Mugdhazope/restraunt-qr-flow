class SMSError(Exception):
    """Base exception for SMS integration errors."""


class SMSConfigError(SMSError):
    """Raised when SMS provider credentials are missing."""


class SMSAPIError(SMSError):
    """Raised when SMS provider request fails."""

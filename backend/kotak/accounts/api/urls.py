from django.urls import path

from .views import CheckInView
from .views import ResendOTPView
from .views import SendOTPView
from .views import VerifyOTPView

app_name = "accounts_api"

urlpatterns = [
    path("auth/check-in/", CheckInView.as_view(), name="check-in"),
    # WA_DISABLED — OTP / WhatsApp auth (re-enable with WhatsApp)
    # path("auth/send-otp/", SendOTPView.as_view(), name="send-otp"),
    # path("auth/resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
    # path("auth/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
]

# Keep view classes imported so re-enabling routes is a one-line change.
_ = (SendOTPView, VerifyOTPView, ResendOTPView)

from django.urls import path

from .views import SendOTPView
from .views import VerifyOTPView

app_name = "accounts_api"

urlpatterns = [
    path("auth/send-otp/", SendOTPView.as_view(), name="send-otp"),
    path("auth/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
]

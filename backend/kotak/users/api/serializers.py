from rest_framework import serializers

from kotak.users.models import User


class UserSerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = ["username", "name", "url"]

        extra_kwargs = {
            "username": {"help_text": "Unique login name."},
            "name": {"help_text": "Display name."},
            "url": {
                "view_name": "api:user-detail",
                "lookup_field": "username",
                "help_text": "Absolute URL for this user's API detail resource.",
            },
        }

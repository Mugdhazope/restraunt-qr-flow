from django.db import migrations
from django.db import models


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0006_restaurant_whatsapp_broadcast_template"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="whatsapp_otp_template_name",
            field=models.CharField(
                blank=True,
                help_text=(
                    "Meta OTP template name; body must include {{1}} for the code."
                ),
                max_length=512,
                verbose_name="WhatsApp OTP template name",
            ),
        ),
        migrations.AddField(
            model_name="restaurant",
            name="whatsapp_otp_template_language",
            field=models.CharField(
                blank=True,
                default="en",
                help_text="OTP template language in WhatsApp Manager (e.g. en).",
                max_length=32,
                verbose_name="WhatsApp OTP template language code",
            ),
        ),
    ]

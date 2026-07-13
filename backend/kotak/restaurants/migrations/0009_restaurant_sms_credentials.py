from django.db import migrations
from django.db import models


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0008_restaurant_whatsapp_feedback_template"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="sms_api_key",
            field=models.TextField(
                blank=True,
                help_text="Optional per-outlet SMS provider API key (MSG91).",
                verbose_name="SMS API key",
            ),
        ),
        migrations.AddField(
            model_name="restaurant",
            name="sms_sender_id",
            field=models.CharField(
                blank=True,
                help_text="Optional per-outlet sender ID for OTP SMS.",
                max_length=32,
                verbose_name="SMS sender ID",
            ),
        ),
        migrations.AddField(
            model_name="restaurant",
            name="sms_template_id",
            field=models.CharField(
                blank=True,
                help_text="Optional per-outlet MSG91 OTP template ID.",
                max_length=128,
                verbose_name="SMS template ID",
            ),
        ),
    ]

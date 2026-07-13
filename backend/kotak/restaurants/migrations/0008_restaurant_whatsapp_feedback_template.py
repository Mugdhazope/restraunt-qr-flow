from django.db import migrations
from django.db import models


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0007_restaurant_whatsapp_otp_template"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="whatsapp_feedback_template_name",
            field=models.CharField(
                blank=True,
                help_text=(
                    "Meta-approved template name for post-visit feedback prompt; "
                    "body should include {{1}} for restaurant/message context."
                ),
                max_length=512,
                verbose_name="WhatsApp feedback template name",
            ),
        ),
        migrations.AddField(
            model_name="restaurant",
            name="whatsapp_feedback_template_language",
            field=models.CharField(
                blank=True,
                default="en",
                help_text="Template language code (e.g. en, en_US); must match Meta.",
                max_length=32,
                verbose_name="WhatsApp feedback template language code",
            ),
        ),
    ]

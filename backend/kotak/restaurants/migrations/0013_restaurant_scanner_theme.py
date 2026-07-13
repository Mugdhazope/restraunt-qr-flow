from django.db import migrations
from django.db import models


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0012_alter_restaurant_google_review_link"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="scanner_theme",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text=(
                    "Optional QR menu appearance overrides: background hex and tag "
                    "styles (bg/text/emoji) for new, featured, popular, etc."
                ),
                verbose_name="scanner theme overrides",
            ),
        ),
    ]

# Generated manually for design_tokens

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0013_restaurant_scanner_theme"),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="design_tokens",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text=(
                    "Global Mobile Experience Builder tokens: primary, secondary, "
                    "accent, background, fontFamily, borderRadius, shadow, spacingScale."
                ),
                verbose_name="design tokens",
            ),
        ),
    ]

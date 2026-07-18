# Generated manually for LayoutAsset

import django.db.models.deletion
from django.conf import settings
from django.db import migrations
from django.db import models

import kotak.layouts.image_utils


class Migration(migrations.Migration):

    dependencies = [
        ("layouts", "0002_schema_version_default_2"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("restaurants", "0013_restaurant_scanner_theme"),
    ]

    operations = [
        migrations.CreateModel(
            name="LayoutAsset",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to=kotak.layouts.image_utils.layout_asset_upload_to, verbose_name="image")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_layout_assets",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="created by",
                    ),
                ),
                (
                    "restaurant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="layout_assets",
                        to="restaurants.restaurant",
                        verbose_name="restaurant",
                    ),
                ),
            ],
            options={
                "verbose_name": "layout asset",
                "verbose_name_plural": "layout assets",
                "ordering": ["-created_at"],
            },
        ),
    ]

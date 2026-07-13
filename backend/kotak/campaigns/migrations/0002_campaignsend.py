import django.db.models.deletion
from django.db import migrations
from django.db import models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0005_templates_membership_and_review_counter"),
        ("campaigns", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CampaignSend",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255, verbose_name="name")),
                ("target_type", models.CharField(max_length=16, verbose_name="target type")),
                ("message", models.TextField(verbose_name="message")),
                (
                    "recipient_count",
                    models.PositiveIntegerField(verbose_name="recipient count"),
                ),
                ("sent", models.PositiveIntegerField(verbose_name="sent")),
                ("failed", models.PositiveIntegerField(verbose_name="failed")),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="created at"),
                ),
                (
                    "restaurant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="campaign_sends",
                        to="restaurants.restaurant",
                        verbose_name="restaurant",
                    ),
                ),
            ],
            options={
                "verbose_name": "campaign send",
                "verbose_name_plural": "campaign sends",
                "ordering": ["-created_at"],
            },
        ),
    ]

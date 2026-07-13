from django.db import migrations
from django.db import models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0010_alter_restaurant_whatsapp_otp_template_language_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="AutomationRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "trigger_type",
                    models.CharField(
                        choices=[
                            ("positive_feedback", "Positive feedback"),
                            ("no_visit_14_days", "No visit for 14 days"),
                            ("third_visit_completed", "Third visit completed"),
                        ],
                        max_length=64,
                        verbose_name="trigger type",
                    ),
                ),
                ("enabled", models.BooleanField(default=True, verbose_name="enabled")),
                ("delay_minutes", models.PositiveIntegerField(default=0, verbose_name="delay minutes")),
                ("message_template", models.TextField(blank=True, verbose_name="message template")),
                ("last_run_at", models.DateTimeField(blank=True, null=True, verbose_name="last run at")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="updated at")),
                (
                    "restaurant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_rules",
                        to="restaurants.restaurant",
                        verbose_name="restaurant",
                    ),
                ),
            ],
            options={
                "verbose_name": "automation rule",
                "verbose_name_plural": "automation rules",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("restaurant", "trigger_type"),
                        name="restaurants_unique_automation_trigger_per_restaurant",
                    ),
                ],
            },
        ),
    ]

from django.db import migrations
from django.db import models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("customers", "0005_customer_phone_verified_fields"),
        ("campaigns", "0003_campaignsend_target_type_length"),
    ]

    operations = [
        migrations.AddField(
            model_name="campaignsend",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="completed at"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="deleted at"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="delivered",
            field=models.PositiveIntegerField(default=0, verbose_name="delivered"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="opened",
            field=models.PositiveIntegerField(default=0, verbose_name="opened"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="queued_task_id",
            field=models.CharField(blank=True, max_length=255, verbose_name="queued task id"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="responses",
            field=models.PositiveIntegerField(default=0, verbose_name="responses"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="scheduled_for",
            field=models.DateTimeField(blank=True, null=True, verbose_name="scheduled for"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="source_campaign",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="resends",
                to="campaigns.campaignsend",
                verbose_name="source campaign",
            ),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="started_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="started at"),
        ),
        migrations.AddField(
            model_name="campaignsend",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("scheduled", "Scheduled"),
                    ("processing", "Processing"),
                    ("sent", "Sent"),
                    ("partial", "Partial"),
                    ("failed", "Failed"),
                    ("cancelled", "Cancelled"),
                ],
                default="pending",
                max_length=24,
                verbose_name="status",
            ),
        ),
        migrations.CreateModel(
            name="CampaignRecipientEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("phone", models.CharField(max_length=32, verbose_name="phone")),
                ("wamid", models.CharField(blank=True, db_index=True, max_length=255, verbose_name="WhatsApp message id")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("sent", "Sent"),
                            ("delivered", "Delivered"),
                            ("read", "Read"),
                            ("failed", "Failed"),
                            ("replied", "Replied"),
                        ],
                        default="pending",
                        max_length=16,
                        verbose_name="status",
                    ),
                ),
                ("sent_at", models.DateTimeField(blank=True, null=True, verbose_name="sent at")),
                ("delivered_at", models.DateTimeField(blank=True, null=True, verbose_name="delivered at")),
                ("read_at", models.DateTimeField(blank=True, null=True, verbose_name="read at")),
                ("failed_at", models.DateTimeField(blank=True, null=True, verbose_name="failed at")),
                ("replied_at", models.DateTimeField(blank=True, null=True, verbose_name="replied at")),
                ("read_count", models.PositiveIntegerField(default=0, verbose_name="read count")),
                ("reply_count", models.PositiveIntegerField(default=0, verbose_name="reply count")),
                ("meta_error_code", models.IntegerField(blank=True, null=True, verbose_name="meta error code")),
                ("failure_details", models.TextField(blank=True, verbose_name="failure details")),
                ("last_status_payload", models.JSONField(blank=True, null=True, verbose_name="last status payload")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="created at")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="updated at")),
                (
                    "campaign_send",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recipient_events",
                        to="campaigns.campaignsend",
                        verbose_name="campaign send",
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="campaign_events",
                        to="customers.customer",
                        verbose_name="customer",
                    ),
                ),
            ],
            options={
                "verbose_name": "campaign recipient event",
                "verbose_name_plural": "campaign recipient events",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="campaignrecipientevent",
            index=models.Index(fields=["campaign_send", "phone"], name="campaigns_ca_campaign_c54fe0_idx"),
        ),
        migrations.AddIndex(
            model_name="campaignrecipientevent",
            index=models.Index(fields=["campaign_send", "status"], name="campaigns_ca_campaign_2ec7fd_idx"),
        ),
    ]

import django.db.models.deletion
from django.conf import settings
from django.db import migrations
from django.db import models


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0004_alter_restaurant_whatsapp_phone_number_id"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="restaurant",
            name="google_review_prompts_sent",
            field=models.PositiveIntegerField(
                default=0,
                verbose_name="Google review prompts sent",
            ),
        ),
        migrations.CreateModel(
            name="MessageTemplate",
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
                ("body", models.TextField(verbose_name="body")),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="created at"),
                ),
                (
                    "restaurant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="message_templates",
                        to="restaurants.restaurant",
                        verbose_name="restaurant",
                    ),
                ),
            ],
            options={
                "verbose_name": "message template",
                "verbose_name_plural": "message templates",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="RestaurantMembership",
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
                (
                    "role",
                    models.CharField(
                        choices=[("admin", "Admin"), ("staff", "Staff")],
                        default="staff",
                        max_length=16,
                        verbose_name="role",
                    ),
                ),
                (
                    "restaurant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="memberships",
                        to="restaurants.restaurant",
                        verbose_name="restaurant",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="restaurant_memberships",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="user",
                    ),
                ),
            ],
            options={
                "verbose_name": "restaurant membership",
                "verbose_name_plural": "restaurant memberships",
            },
        ),
        migrations.AddConstraint(
            model_name="restaurantmembership",
            constraint=models.UniqueConstraint(
                fields=("user", "restaurant"),
                name="restaurants_unique_membership_per_user_restaurant",
            ),
        ),
    ]

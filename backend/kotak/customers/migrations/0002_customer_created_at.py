# Generated manually for dashboard analytics

from __future__ import annotations

from django.db import migrations
from django.db import models
from django.db.models import Min
from django.utils import timezone


def backfill_customer_created_at(apps, schema_editor):
    Customer = apps.get_model("customers", "Customer")
    Visit = apps.get_model("customers", "Visit")
    now = timezone.now()
    for customer in Customer.objects.all().iterator():
        first = (
            Visit.objects.filter(customer_id=customer.pk).aggregate(m=Min("visit_time"))["m"]
        )
        customer.created_at = first or now
        customer.save(update_fields=["created_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="created_at",
            field=models.DateTimeField(null=True, verbose_name="created at"),
        ),
        migrations.RunPython(backfill_customer_created_at, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="customer",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, verbose_name="created at"),
        ),
    ]

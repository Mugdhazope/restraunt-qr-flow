from django.db import migrations
from django.db import models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0002_customer_created_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="customer",
            name="notes",
            field=models.TextField(blank=True, verbose_name="notes"),
        ),
    ]

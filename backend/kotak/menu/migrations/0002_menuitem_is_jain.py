from django.db import migrations
from django.db import models


class Migration(migrations.Migration):

    dependencies = [
        ("menu", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="menuitem",
            name="is_jain",
            field=models.BooleanField(default=False, verbose_name="Jain option"),
        ),
    ]

# Generated manually for two-step WhatsApp feedback flow

import django.utils.timezone
from django.db import migrations, models


def backfill_is_complete(apps, schema_editor):
    Feedback = apps.get_model("feedback", "Feedback")
    Feedback.objects.all().update(is_complete=True)


class Migration(migrations.Migration):

    dependencies = [
        ("feedback", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="feedback",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
                verbose_name="created at",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="feedback",
            name="is_complete",
            field=models.BooleanField(default=False, verbose_name="complete"),
        ),
        migrations.RunPython(backfill_is_complete, migrations.RunPython.noop),
    ]

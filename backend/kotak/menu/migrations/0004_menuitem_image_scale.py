from django.core.validators import MaxValueValidator
from django.core.validators import MinValueValidator
from django.db import migrations
from django.db import models


class Migration(migrations.Migration):
    dependencies = [
        ("menu", "0003_menuitem_image_upload_to_uuid"),
    ]

    operations = [
        migrations.AddField(
            model_name="menuitem",
            name="image_scale",
            field=models.PositiveSmallIntegerField(
                default=100,
                validators=[MinValueValidator(50), MaxValueValidator(200)],
                verbose_name="image scale percent",
            ),
        ),
    ]

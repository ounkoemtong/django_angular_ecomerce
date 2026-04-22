from urllib.parse import urlparse

from django.db import migrations, models


def normalize_media_name(value):
    if not value:
        return value
    if hasattr(value, "name"):
        value = value.name
    value = str(value)
    parsed = urlparse(value)
    path = parsed.path or value
    marker = "/media/"
    if marker in path:
        return path.split(marker, 1)[1]
    return path.lstrip("/")


def migrate_existing_media_paths(apps, schema_editor):
    updates = (
        ("ProductColorVariant", "image"),
        ("ProductFreeItem", "image"),
        ("ProductImage", "image"),
    )
    for model_name, field_name in updates:
        model = apps.get_model("store", model_name)
        for instance in model.objects.exclude(**{field_name: ""}):
            current_value = getattr(instance, field_name)
            normalized_value = normalize_media_name(current_value)
            if normalized_value != current_value:
                setattr(instance, field_name, normalized_value)
                instance.save(update_fields=[field_name])


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0002_emailotp_userprofile"),
    ]

    operations = [
        migrations.AddField(
            model_name="brand",
            name="image",
            field=models.FileField(blank=True, upload_to="brands/"),
        ),
        migrations.AddField(
            model_name="category",
            name="image",
            field=models.FileField(blank=True, upload_to="categories/"),
        ),
        migrations.AddField(
            model_name="product",
            name="image",
            field=models.FileField(blank=True, upload_to="products/cover/"),
        ),
        migrations.AlterField(
            model_name="productcolorvariant",
            name="image",
            field=models.FileField(upload_to="products/colors/"),
        ),
        migrations.AlterField(
            model_name="productfreeitem",
            name="image",
            field=models.FileField(upload_to="products/free-items/"),
        ),
        migrations.AlterField(
            model_name="productimage",
            name="image",
            field=models.FileField(upload_to="products/images/"),
        ),
        migrations.RunPython(migrate_existing_media_paths, migrations.RunPython.noop),
    ]

# Generated manually for organization business profile.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "organizations",
            "0003_rename_organizatio_organiz_7f2a1c_idx_organizatio_organiz_a8ab14_idx",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="logo",
            field=models.ImageField(blank=True, null=True, upload_to="org_logos/"),
        ),
        migrations.AddField(
            model_name="organization",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="organization",
            name="industry",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
        migrations.AddField(
            model_name="organization",
            name="website",
            field=models.URLField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="organization",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="organization",
            name="address",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="organization",
            name="business_context",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]

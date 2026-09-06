# Generated manually for trial card fields.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0003_payment_request_usd_currency"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscription",
            name="payment_method",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="subscription",
            name="card_last4",
            field=models.CharField(blank=True, default="", max_length=4),
        ),
        migrations.AddField(
            model_name="subscription",
            name="card_brand",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="subscription",
            name="payment_method_ref",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
        migrations.AddField(
            model_name="subscription",
            name="auto_charge",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="subscription",
            name="last_charged_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="plan",
            name="trial_days",
            field=models.PositiveIntegerField(default=15),
        ),
    ]

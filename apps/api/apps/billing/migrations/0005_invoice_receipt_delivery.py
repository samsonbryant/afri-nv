from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("billing", "0004_subscription_card_trial")]

    operations = [
        migrations.AddField(model_name="invoice", name="receipt_number", field=models.CharField(blank=True, max_length=64, null=True, unique=True)),
        migrations.AddField(model_name="invoice", name="receipt_url", field=models.URLField(blank=True, default="")),
        migrations.AddField(model_name="invoice", name="payment_provider", field=models.CharField(blank=True, default="", max_length=32)),
        migrations.AddField(model_name="invoice", name="payment_reference", field=models.CharField(blank=True, db_index=True, default="", max_length=128)),
        migrations.AddField(model_name="invoice", name="emailed_to", field=models.EmailField(blank=True, default="", max_length=254)),
        migrations.AddField(model_name="invoice", name="emailed_at", field=models.DateTimeField(blank=True, null=True)),
    ]

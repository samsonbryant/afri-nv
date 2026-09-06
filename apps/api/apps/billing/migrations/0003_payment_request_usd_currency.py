# Generated manually for USD-only payment currency.

from django.db import migrations, models


def normalize_to_usd(apps, schema_editor):
    """Relabel non-USD payment rows and reverse the old local FX for common CFA codes."""
    PaymentRequest = apps.get_model("billing", "PaymentRequest")
    legacy_rate = 600
    for req in PaymentRequest.objects.exclude(currency__iexact="usd").iterator():
        code = (req.currency or "").lower()
        if code in {"xaf", "xof", "cfa"} and legacy_rate > 0:
            req.amount_cents = max(1, round(req.amount_cents / legacy_rate))
        req.currency = "usd"
        req.save(update_fields=["amount_cents", "currency"])


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0002_payment_request"),
    ]

    operations = [
        migrations.AlterField(
            model_name="paymentrequest",
            name="currency",
            field=models.CharField(default="usd", max_length=8),
        ),
        migrations.RunPython(normalize_to_usd, migrations.RunPython.noop),
    ]

# Generated manually for MTN/Orange Money payment requests

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("billing", "0001_phase11_18"),
        (
            "organizations",
            "0003_rename_organizatio_organiz_7f2a1c_idx_organizatio_organiz_a8ab14_idx",
        ),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "provider",
                    models.CharField(
                        choices=[
                            ("mtn_momo", "MTN Mobile Money"),
                            ("orange_money", "Orange Money"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("submitted", "Submitted"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("cancelled", "Cancelled"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=32,
                    ),
                ),
                ("amount_cents", models.PositiveIntegerField()),
                ("currency", models.CharField(default="xaf", max_length=8)),
                ("reference", models.CharField(db_index=True, max_length=64, unique=True)),
                ("payer_phone", models.CharField(blank=True, default="", max_length=32)),
                ("payer_name", models.CharField(blank=True, default="", max_length=128)),
                ("transaction_id", models.CharField(blank=True, default="", max_length=128)),
                ("notes", models.TextField(blank=True, default="")),
                ("rejection_reason", models.TextField(blank=True, default="")),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payment_requests",
                        to="organizations.organization",
                    ),
                ),
                (
                    "plan",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="payment_requests",
                        to="billing.plan",
                    ),
                ),
                (
                    "requested_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payment_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_payment_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "subscription",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="payment_requests",
                        to="billing.subscription",
                    ),
                ),
            ],
            options={
                "db_table": "billing_payment_request",
                "ordering": ("-created_at",),
            },
        ),
    ]

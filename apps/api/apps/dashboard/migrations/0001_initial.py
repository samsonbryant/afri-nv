# Generated manually for Novixa dashboard

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=255)),
                ("body", models.TextField(blank=True, default="")),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("info", "Info"),
                            ("success", "Success"),
                            ("warning", "Warning"),
                            ("error", "Error"),
                            ("invite", "Invite"),
                            ("system", "System"),
                        ],
                        default="info",
                        max_length=32,
                    ),
                ),
                ("link", models.CharField(blank=True, default="", max_length=512)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                (
                    "organization",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to="organizations.organization",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "dashboard_notification",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="AiUsageRecord",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("tokens", models.PositiveIntegerField(default=0)),
                ("model", models.CharField(blank=True, default="", max_length=128)),
                ("feature", models.CharField(blank=True, default="assistant", max_length=64)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_usage_records",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "dashboard_ai_usage_record",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["user", "read_at"], name="dashboard_n_user_id_b8f0a1_idx"),
        ),
        migrations.AddIndex(
            model_name="aiusagerecord",
            index=models.Index(
                fields=["organization", "created_at"],
                name="dashboard_a_organiz_c1d2e3_idx",
            ),
        ),
    ]

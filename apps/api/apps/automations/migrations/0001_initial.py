# Generated manually for Novixa automations

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizations", "0001_initial"),
        ("workflows", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AutomationRun",
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
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("running", "Running"),
                            ("succeeded", "Succeeded"),
                            ("failed", "Failed"),
                            ("cancelled", "Cancelled"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=32,
                    ),
                ),
                ("input_payload", models.JSONField(blank=True, default=dict)),
                ("output_payload", models.JSONField(blank=True, default=dict)),
                ("error_message", models.TextField(blank=True, default="")),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_runs",
                        to="organizations.organization",
                    ),
                ),
                (
                    "triggered_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="triggered_automation_runs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="runs",
                        to="workflows.workflow",
                    ),
                ),
            ],
            options={
                "db_table": "automations_automationrun",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="automationrun",
            index=models.Index(
                fields=["organization", "status"],
                name="automations_organiz_8a1b2c_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="automationrun",
            index=models.Index(
                fields=["workflow", "status"],
                name="automations_workflo_9d3e4f_idx",
            ),
        ),
    ]

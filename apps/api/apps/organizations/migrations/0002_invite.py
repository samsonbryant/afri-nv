# Generated manually for Novixa organizations invites

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Invite",
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
                ("email", models.EmailField(db_index=True, max_length=254)),
                (
                    "role",
                    models.CharField(
                        choices=[("admin", "Admin"), ("member", "Member")],
                        default="member",
                        max_length=16,
                    ),
                ),
                ("token", models.CharField(db_index=True, max_length=64, unique=True)),
                ("expires_at", models.DateTimeField()),
                ("accepted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "invited_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sent_invites",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invites",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "organizations_invite",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="invite",
            index=models.Index(
                fields=["organization", "email"],
                name="organizatio_organiz_7f2a1c_idx",
            ),
        ),
    ]

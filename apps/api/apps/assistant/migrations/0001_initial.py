# Generated manually for Novixa assistant

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
            name="Conversation",
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
                ("title", models.CharField(blank=True, default="New conversation", max_length=255)),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversations",
                        to="organizations.organization",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "assistant_conversation",
                "ordering": ("-updated_at",),
            },
        ),
        migrations.CreateModel(
            name="Message",
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
                    "role",
                    models.CharField(
                        choices=[
                            ("user", "User"),
                            ("assistant", "Assistant"),
                            ("system", "System"),
                        ],
                        max_length=16,
                    ),
                ),
                ("content", models.TextField()),
                (
                    "content_type",
                    models.CharField(
                        choices=[
                            ("text", "Text"),
                            ("markdown", "Markdown"),
                            ("code", "Code"),
                            ("image", "Image"),
                        ],
                        default="markdown",
                        max_length=16,
                    ),
                ),
                ("attachments", models.JSONField(blank=True, default=list)),
                ("citations", models.JSONField(blank=True, default=list)),
                (
                    "conversation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="messages",
                        to="assistant.conversation",
                    ),
                ),
            ],
            options={
                "db_table": "assistant_message",
                "ordering": ("created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="conversation",
            index=models.Index(
                fields=["organization", "user"],
                name="assistant_c_organiz_a1b2c3_idx",
            ),
        ),
    ]

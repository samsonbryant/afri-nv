# Generated manually for Novixa AI engine
#
# Creates embedding as JSONField for portable schema state. On PostgreSQL,
# a follow-up operation casts the column to vector(1536) when pgvector exists.
# SQLite test runs keep JSON storage and use in-memory cosine similarity.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def cast_embedding_to_vector(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
        # Fresh install: replace JSON column with native vector column
        cursor.execute("ALTER TABLE ai_engine_document DROP COLUMN IF EXISTS embedding")
        cursor.execute("ALTER TABLE ai_engine_document ADD COLUMN embedding vector(1536) NULL")


def reverse_cast_embedding(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("ALTER TABLE ai_engine_document DROP COLUMN IF EXISTS embedding")
        cursor.execute("ALTER TABLE ai_engine_document ADD COLUMN embedding jsonb NULL")


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Document",
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
                ("content", models.TextField()),
                ("source", models.CharField(db_index=True, default="manual", max_length=64)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("embedding", models.JSONField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_documents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="documents",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "db_table": "ai_engine_document",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="document",
            index=models.Index(
                fields=["organization", "source"],
                name="ai_engine_d_organiz_a1b2c3_idx",
            ),
        ),
        migrations.RunPython(cast_embedding_to_vector, reverse_cast_embedding),
    ]

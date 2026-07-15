"""AI engine ORM models with pgvector VectorField on PostgreSQL."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel

_ENGINE = settings.DATABASES["default"].get("ENGINE", "")
_USE_PGVECTOR = "postgresql" in _ENGINE

if _USE_PGVECTOR:
    from pgvector.django import VectorField

    class EmbeddingField(VectorField):  # type: ignore[misc, valid-type]
        """pgvector-backed embedding column."""

        def __init__(self, dimensions: int | None = None, **kwargs: object) -> None:
            super().__init__(dimensions=dimensions, **kwargs)

else:

    class EmbeddingField(models.JSONField):  # type: ignore[no-redef]
        """JSON list fallback for SQLite tests."""

        def __init__(self, dimensions: int | None = None, **kwargs: object) -> None:
            self.dimensions = dimensions
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
            super().__init__(**kwargs)


class Document(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    source = models.CharField(max_length=64, default="manual", db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    embedding = EmbeddingField(
        dimensions=int(getattr(settings, "EMBEDDING_DIMENSIONS", 1536)),
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_documents",
    )

    class Meta:
        db_table = "ai_engine_document"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["organization", "source"]),
        ]

    def __str__(self) -> str:
        return self.title

"""Reusable EmbeddingField — pgvector when available, JSON otherwise."""

from __future__ import annotations

from django.conf import settings
from django.db import models


def _pgvector_available() -> bool:
    if not getattr(settings, "USE_PGVECTOR", True):
        return False
    engine = settings.DATABASES["default"].get("ENGINE", "")
    if "postgresql" not in engine:
        return False
    try:
        import pgvector.django  # noqa: F401
    except ImportError:
        return False
    return bool(getattr(settings, "PGVECTOR_EXTENSION_ENABLED", False))


_USE_PGVECTOR = _pgvector_available()

if _USE_PGVECTOR:
    from pgvector.django import VectorField

    class EmbeddingField(VectorField):  # type: ignore[misc, valid-type]
        """pgvector-backed embedding column."""

        def __init__(self, dimensions: int | None = None, **kwargs: object) -> None:
            super().__init__(dimensions=dimensions, **kwargs)

else:

    class EmbeddingField(models.JSONField):  # type: ignore[no-redef]
        """JSON list fallback when pgvector is unavailable."""

        def __init__(self, dimensions: int | None = None, **kwargs: object) -> None:
            self.dimensions = dimensions
            kwargs.setdefault("null", True)
            kwargs.setdefault("blank", True)
            super().__init__(**kwargs)

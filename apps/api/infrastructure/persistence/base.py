"""Abstract base models shared across feature apps."""

from __future__ import annotations

import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Adds created_at / updated_at timestamps."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """Uses UUID primary keys."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """Optional soft-delete support."""

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel):
    """UUID + timestamps — default concrete-model base."""

    class Meta:
        abstract = True
        ordering = ("-created_at",)

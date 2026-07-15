"""Workflow ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class Workflow(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        ARCHIVED = "archived", "Archived"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="workflows",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    definition = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_workflows",
    )

    class Meta:
        db_table = "workflows_workflow"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["organization", "status"]),
        ]

    def __str__(self) -> str:
        return self.name

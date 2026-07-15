"""Dashboard ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class Notification(BaseModel):
    class Type(models.TextChoices):
        INFO = "info", "Info"
        SUCCESS = "success", "Success"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"
        INVITE = "invite", "Invite"
        SYSTEM = "system", "System"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, default="")
    type = models.CharField(max_length=32, choices=Type.choices, default=Type.INFO)
    link = models.CharField(max_length=512, blank=True, default="")
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "dashboard_notification"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self) -> str:
        return self.title


class AiUsageRecord(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="ai_usage_records",
    )
    tokens = models.PositiveIntegerField(default=0)
    model = models.CharField(max_length=128, blank=True, default="")
    feature = models.CharField(max_length=64, blank=True, default="assistant")

    class Meta:
        db_table = "dashboard_ai_usage_record"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["organization", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.organization_id}: {self.tokens} tokens"

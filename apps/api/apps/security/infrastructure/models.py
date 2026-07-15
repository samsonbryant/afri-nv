"""Security ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class AuditLog(BaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=128, db_index=True)
    resource_type = models.CharField(max_length=64, blank=True, default="")
    resource_id = models.CharField(max_length=64, blank=True, default="")
    ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "security_audit_log"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "action"])]

    def __str__(self) -> str:
        return f"{self.action}:{self.resource_type}"


class BackupRecord(BaseModel):
    status = models.CharField(max_length=32, default="pending")
    location = models.CharField(max_length=512, blank=True, default="")
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="backup_records",
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "security_backup_record"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.status}:{self.created_at}"

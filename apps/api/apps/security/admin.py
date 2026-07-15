"""Security admin."""

from __future__ import annotations

from django.contrib import admin

from apps.security.infrastructure.models import AuditLog, BackupRecord


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "actor", "organization", "resource_type", "created_at")
    list_filter = ("action",)
    search_fields = ("action", "resource_id")
    autocomplete_fields = ("actor", "organization")


@admin.register(BackupRecord)
class BackupRecordAdmin(admin.ModelAdmin):
    list_display = ("status", "triggered_by", "completed_at", "location")
    list_filter = ("status",)
    autocomplete_fields = ("triggered_by",)

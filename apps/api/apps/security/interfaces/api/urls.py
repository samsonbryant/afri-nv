"""Security API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.security.interfaces.api.views import (
    AuditLogListView,
    BackupTriggerView,
    SecurityStatusView,
)

app_name = "security"

urlpatterns = [
    path("audit-logs/", AuditLogListView.as_view(), name="audit-logs"),
    path("backups/", BackupTriggerView.as_view(), name="backups"),
    path("status/", SecurityStatusView.as_view(), name="status"),
]

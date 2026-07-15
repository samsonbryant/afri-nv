"""Dashboard admin."""

from __future__ import annotations

from django.contrib import admin

from apps.dashboard.infrastructure.models import AiUsageRecord, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "type", "read_at", "created_at")
    list_filter = ("type",)
    search_fields = ("title", "user__email")


@admin.register(AiUsageRecord)
class AiUsageRecordAdmin(admin.ModelAdmin):
    list_display = ("organization", "tokens", "model", "feature", "created_at")
    search_fields = ("organization__name", "model")

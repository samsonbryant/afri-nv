"""Automations admin."""

from __future__ import annotations

from django.contrib import admin

from apps.automations.infrastructure.models import AutomationRun


@admin.register(AutomationRun)
class AutomationRunAdmin(admin.ModelAdmin):
    list_display = ("id", "workflow", "status", "triggered_by", "created_at")
    list_filter = ("status",)
    search_fields = ("workflow__name",)
    autocomplete_fields = ("workflow", "triggered_by")
    readonly_fields = ("started_at", "finished_at", "created_at", "updated_at")

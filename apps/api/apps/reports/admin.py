"""Reports admin."""

from __future__ import annotations

from django.contrib import admin

from apps.reports.infrastructure.models import Report, ReportSchedule


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "status", "organization", "created_at")
    list_filter = ("type", "status")
    search_fields = ("title", "organization__name")
    autocomplete_fields = ("organization", "created_by")


@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = ("report_type", "period", "is_active", "organization", "last_run_at")
    list_filter = ("period", "is_active")
    search_fields = ("organization__name",)
    autocomplete_fields = ("organization",)

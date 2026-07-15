"""Workflows admin."""

from __future__ import annotations

from django.contrib import admin

from apps.workflows.infrastructure.models import Workflow


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "organization__name")
    autocomplete_fields = ("organization", "created_by")

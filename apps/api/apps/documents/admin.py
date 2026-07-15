"""Documents admin."""

from __future__ import annotations

from django.contrib import admin

from apps.documents.infrastructure.models import DocumentJob, StudioDocument


@admin.register(StudioDocument)
class StudioDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "file_type", "status", "created_at")
    list_filter = ("status", "file_type")
    search_fields = ("title",)
    autocomplete_fields = ("organization", "created_by")


@admin.register(DocumentJob)
class DocumentJobAdmin(admin.ModelAdmin):
    list_display = ("document", "job_type", "status", "created_at")
    list_filter = ("job_type", "status")

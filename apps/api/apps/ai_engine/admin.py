"""AI engine admin."""

from __future__ import annotations

from django.contrib import admin

from apps.ai_engine.infrastructure.models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "source", "created_at")
    search_fields = ("title", "content")
    list_filter = ("source",)
    autocomplete_fields = ("organization", "created_by")

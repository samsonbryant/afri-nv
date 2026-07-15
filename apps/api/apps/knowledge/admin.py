"""Knowledge admin."""

from __future__ import annotations

from django.contrib import admin

from apps.knowledge.infrastructure.models import (
    KnowledgeChunk,
    KnowledgeConversation,
    KnowledgeDocument,
    KnowledgeMessage,
)


@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "file_type", "status", "chunk_count", "created_at")
    list_filter = ("status", "file_type")
    search_fields = ("title",)
    autocomplete_fields = ("organization", "created_by")


@admin.register(KnowledgeChunk)
class KnowledgeChunkAdmin(admin.ModelAdmin):
    list_display = ("document", "index", "created_at")
    search_fields = ("content",)


@admin.register(KnowledgeConversation)
class KnowledgeConversationAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "user", "updated_at")
    search_fields = ("title",)
    autocomplete_fields = ("organization", "user")


@admin.register(KnowledgeMessage)
class KnowledgeMessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "role", "created_at")
    list_filter = ("role",)

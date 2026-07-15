"""Assistant admin."""

from __future__ import annotations

from django.contrib import admin

from apps.assistant.infrastructure.models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "user", "updated_at")
    search_fields = ("title", "user__email", "organization__name")
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "role", "content_type", "created_at")
    list_filter = ("role", "content_type")

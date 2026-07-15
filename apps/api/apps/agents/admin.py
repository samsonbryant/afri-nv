from __future__ import annotations

from django.contrib import admin

from apps.agents.infrastructure.models import Agent, AgentMemory, AgentRun


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "organization", "is_active")
    list_filter = ("type", "is_active")
    search_fields = ("name",)
    autocomplete_fields = ("organization",)


@admin.register(AgentRun)
class AgentRunAdmin(admin.ModelAdmin):
    list_display = ("agent", "user", "status", "tokens_used", "created_at")
    list_filter = ("status",)
    autocomplete_fields = ("agent", "user")


@admin.register(AgentMemory)
class AgentMemoryAdmin(admin.ModelAdmin):
    list_display = ("agent", "key")
    autocomplete_fields = ("agent",)

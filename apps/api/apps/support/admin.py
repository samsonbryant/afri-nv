"""Support admin."""

from __future__ import annotations

from django.contrib import admin

from apps.support.infrastructure.models import (
    CannedResponse,
    SupportChannel,
    Ticket,
    TicketMessage,
)


@admin.register(SupportChannel)
class SupportChannelAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "organization", "is_active")
    list_filter = ("type", "is_active")
    search_fields = ("name", "organization__name")
    autocomplete_fields = ("organization",)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("subject", "organization", "status", "priority", "assignee")
    list_filter = ("status", "priority")
    search_fields = ("subject", "requester_email")
    autocomplete_fields = ("organization", "channel", "assignee")


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ("ticket", "sender_type", "is_internal", "created_at")
    list_filter = ("sender_type",)


@admin.register(CannedResponse)
class CannedResponseAdmin(admin.ModelAdmin):
    list_display = ("title", "shortcut", "organization")
    autocomplete_fields = ("organization",)

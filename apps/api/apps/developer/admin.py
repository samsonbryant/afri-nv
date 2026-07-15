"""Developer admin."""

from __future__ import annotations

from django.contrib import admin

from apps.developer.infrastructure.models import ApiKey, WebhookDelivery, WebhookEndpoint


@admin.register(WebhookEndpoint)
class WebhookEndpointAdmin(admin.ModelAdmin):
    list_display = ("url", "organization", "is_active")
    list_filter = ("is_active",)
    search_fields = ("url", "organization__name")
    autocomplete_fields = ("organization",)


@admin.register(WebhookDelivery)
class WebhookDeliveryAdmin(admin.ModelAdmin):
    list_display = ("event", "endpoint", "status", "response_code", "delivered_at")
    list_filter = ("status", "event")
    autocomplete_fields = ("endpoint",)


@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    list_display = ("name", "prefix", "organization", "is_active", "last_used_at")
    list_filter = ("is_active",)
    autocomplete_fields = ("organization",)

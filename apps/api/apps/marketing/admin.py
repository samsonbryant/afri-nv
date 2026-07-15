"""Marketing admin."""

from __future__ import annotations

from django.contrib import admin

from apps.marketing.infrastructure.models import Campaign, MarketingAsset


@admin.register(MarketingAsset)
class MarketingAssetAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "status", "organization", "created_at")
    list_filter = ("type", "status")
    search_fields = ("title", "organization__name")
    autocomplete_fields = ("organization", "created_by")


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("name", "channel", "status", "organization", "scheduled_at")
    list_filter = ("status",)
    search_fields = ("name", "organization__name")
    autocomplete_fields = ("organization", "asset")

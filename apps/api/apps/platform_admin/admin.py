"""Platform admin Django admin."""

from __future__ import annotations

from django.contrib import admin

from apps.platform_admin.infrastructure.models import PlatformSetting


@admin.register(PlatformSetting)
class PlatformSettingAdmin(admin.ModelAdmin):
    list_display = ("key", "description", "updated_at")
    search_fields = ("key",)

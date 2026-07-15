"""Organizations admin."""

from __future__ import annotations

from django.contrib import admin

from apps.organizations.infrastructure.models import Membership, Organization


class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 0
    autocomplete_fields = ("user",)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "plan", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [MembershipInline]


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "organization", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__email", "organization__name")
    autocomplete_fields = ("user", "organization")

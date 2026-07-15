"""CRM admin."""

from __future__ import annotations

from django.contrib import admin

from apps.crm.infrastructure.models import (
    Company,
    Contact,
    CrmActivity,
    CrmNote,
    Lead,
    Opportunity,
)


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "domain", "industry", "created_at")
    search_fields = ("name", "domain")
    autocomplete_fields = ("organization",)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "organization", "status")
    search_fields = ("first_name", "last_name", "email")
    autocomplete_fields = ("organization", "company")


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "status", "score", "owner")
    list_filter = ("status",)
    search_fields = ("title",)
    autocomplete_fields = ("organization", "contact", "company", "owner")


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "stage", "amount", "owner")
    list_filter = ("stage",)
    search_fields = ("name",)
    autocomplete_fields = ("organization", "company", "contact", "owner")


@admin.register(CrmNote)
class CrmNoteAdmin(admin.ModelAdmin):
    list_display = ("related_type", "object_id", "organization", "created_at")
    search_fields = ("body",)
    autocomplete_fields = ("organization", "author")


@admin.register(CrmActivity)
class CrmActivityAdmin(admin.ModelAdmin):
    list_display = ("subject", "type", "organization", "due_at", "completed_at")
    list_filter = ("type",)
    search_fields = ("subject",)
    autocomplete_fields = ("organization", "assignee")

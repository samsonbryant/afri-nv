"""CRM API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.crm.interfaces.api.views import (
    ActivityAiFollowUpView,
    ActivityDetailView,
    ActivityListCreateView,
    CompanyDetailView,
    CompanyListCreateView,
    ContactDetailView,
    ContactListCreateView,
    LeadConvertView,
    LeadDetailView,
    LeadListCreateView,
    NoteDetailView,
    NoteListCreateView,
    OpportunityDetailView,
    OpportunityListCreateView,
    PipelineView,
)

app_name = "crm"

urlpatterns = [
    path("companies/", CompanyListCreateView.as_view(), name="companies"),
    path("companies/<uuid:company_id>/", CompanyDetailView.as_view(), name="company-detail"),
    path("contacts/", ContactListCreateView.as_view(), name="contacts"),
    path("contacts/<uuid:contact_id>/", ContactDetailView.as_view(), name="contact-detail"),
    path("leads/", LeadListCreateView.as_view(), name="leads"),
    path("leads/<uuid:lead_id>/", LeadDetailView.as_view(), name="lead-detail"),
    path("leads/<uuid:lead_id>/convert/", LeadConvertView.as_view(), name="lead-convert"),
    path("opportunities/", OpportunityListCreateView.as_view(), name="opportunities"),
    path(
        "opportunities/<uuid:opportunity_id>/",
        OpportunityDetailView.as_view(),
        name="opportunity-detail",
    ),
    path("pipeline/", PipelineView.as_view(), name="pipeline"),
    path("notes/", NoteListCreateView.as_view(), name="notes"),
    path("notes/<uuid:note_id>/", NoteDetailView.as_view(), name="note-detail"),
    path("activities/", ActivityListCreateView.as_view(), name="activities"),
    path("activities/<uuid:activity_id>/", ActivityDetailView.as_view(), name="activity-detail"),
    path(
        "activities/<uuid:activity_id>/ai-follow-up/",
        ActivityAiFollowUpView.as_view(),
        name="activity-ai-follow-up",
    ),
]

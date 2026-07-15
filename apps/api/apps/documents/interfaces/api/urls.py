"""Documents Studio API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.documents.interfaces.api.views import (
    DocumentDetailView,
    DocumentJobsView,
    DocumentListCreateView,
    JobDetailView,
)

app_name = "documents"

urlpatterns = [
    path("", DocumentListCreateView.as_view(), name="documents"),
    path(
        "<uuid:document_id>/",
        DocumentDetailView.as_view(),
        name="document-detail",
    ),
    path(
        "<uuid:document_id>/jobs/",
        DocumentJobsView.as_view(),
        name="document-jobs",
    ),
    path("jobs/<uuid:job_id>/", JobDetailView.as_view(), name="job-detail"),
]

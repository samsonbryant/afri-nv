"""AI engine API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.ai_engine.interfaces.api.views import (
    DocumentDetailView,
    DocumentListCreateView,
    DocumentSearchView,
)

app_name = "ai_engine"

urlpatterns = [
    path("documents/", DocumentListCreateView.as_view(), name="documents"),
    path("documents/search/", DocumentSearchView.as_view(), name="documents-search"),
    path(
        "documents/<uuid:document_id>/",
        DocumentDetailView.as_view(),
        name="document-detail",
    ),
]

"""Workflow API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.workflows.interfaces.api.views import WorkflowDetailView, WorkflowListCreateView

app_name = "workflows"

urlpatterns = [
    path("", WorkflowListCreateView.as_view(), name="list-create"),
    path("<uuid:workflow_id>/", WorkflowDetailView.as_view(), name="detail"),
]

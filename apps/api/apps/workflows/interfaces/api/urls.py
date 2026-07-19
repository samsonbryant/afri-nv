"""Workflow API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.workflows.interfaces.api.views import (
    WorkflowDetailView,
    WorkflowListCreateView,
    WorkflowNodeTypesView,
    WorkflowPublishView,
    WorkflowRunsView,
    WorkflowRunView,
    WorkflowValidateView,
)

app_name = "workflows"

urlpatterns = [
    path("", WorkflowListCreateView.as_view(), name="list-create"),
    path("node-types/", WorkflowNodeTypesView.as_view(), name="node-types"),
    path("<uuid:workflow_id>/", WorkflowDetailView.as_view(), name="detail"),
    path("<uuid:workflow_id>/validate/", WorkflowValidateView.as_view(), name="validate"),
    path("<uuid:workflow_id>/publish/", WorkflowPublishView.as_view(), name="publish"),
    path("<uuid:workflow_id>/run/", WorkflowRunView.as_view(), name="run"),
    path("<uuid:workflow_id>/runs/", WorkflowRunsView.as_view(), name="runs"),
]

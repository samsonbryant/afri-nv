"""Automation API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.automations.interfaces.api.views import (
    AutomationRunDetailView,
    AutomationRunListView,
    AutomationTriggerView,
)

app_name = "automations"

urlpatterns = [
    path("", AutomationRunListView.as_view(), name="list"),
    path("trigger/", AutomationTriggerView.as_view(), name="trigger"),
    path("<uuid:run_id>/", AutomationRunDetailView.as_view(), name="detail"),
]

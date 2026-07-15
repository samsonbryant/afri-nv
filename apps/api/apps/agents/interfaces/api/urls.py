from __future__ import annotations

from django.urls import path

from apps.agents.interfaces.api.views import (
    AgentCatalogView,
    AgentDetailView,
    AgentListCreateView,
    AgentRunsListView,
    AgentRunView,
)

app_name = "agents"

urlpatterns = [
    path("catalog/", AgentCatalogView.as_view(), name="catalog"),
    path("", AgentListCreateView.as_view(), name="list-create"),
    path("<uuid:agent_id>/", AgentDetailView.as_view(), name="detail"),
    path("<uuid:agent_id>/run/", AgentRunView.as_view(), name="run"),
    path("<uuid:agent_id>/runs/", AgentRunsListView.as_view(), name="runs"),
]

"""API v1 route wiring."""

from __future__ import annotations

from django.urls import include, path

urlpatterns = [
    path("health/", include("apps.core.interfaces.api.urls")),
    path("auth/", include("apps.accounts.interfaces.api.urls")),
    path("organizations/", include("apps.organizations.interfaces.api.urls")),
    path("workflows/", include("apps.workflows.interfaces.api.urls")),
    path("automations/", include("apps.automations.interfaces.api.urls")),
    path("ai/", include("apps.ai_engine.interfaces.api.urls")),
]

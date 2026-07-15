"""API v1 route wiring."""

from __future__ import annotations

from django.urls import include, path

from apps.dashboard.interfaces.api.urls import notification_urlpatterns
from apps.developer.interfaces.api.urls import api_key_urlpatterns, webhook_urlpatterns

urlpatterns = [
    path("health/", include("apps.core.interfaces.api.urls")),
    path("auth/", include("apps.accounts.interfaces.api.urls")),
    path("organizations/", include("apps.organizations.interfaces.api.urls")),
    path("workflows/", include("apps.workflows.interfaces.api.urls")),
    path("automations/", include("apps.automations.interfaces.api.urls")),
    path("ai/", include("apps.ai_engine.interfaces.api.urls")),
    path("dashboard/", include("apps.dashboard.interfaces.api.urls")),
    path("notifications/", include((notification_urlpatterns, "notifications"))),
    path("assistant/", include("apps.assistant.interfaces.api.urls")),
    path("knowledge/", include("apps.knowledge.interfaces.api.urls")),
    path("crm/", include("apps.crm.interfaces.api.urls")),
    path("support/", include("apps.support.interfaces.api.urls")),
    path("marketing/", include("apps.marketing.interfaces.api.urls")),
    path("documents/", include("apps.documents.interfaces.api.urls")),
    path("reports/", include("apps.reports.interfaces.api.urls")),
    path("meetings/", include("apps.meetings.interfaces.api.urls")),
    path("agents/", include("apps.agents.interfaces.api.urls")),
    path("billing/", include("apps.billing.interfaces.api.urls")),
    path("admin/", include("apps.platform_admin.interfaces.api.urls")),
    path("analytics/", include("apps.analytics.interfaces.api.urls")),
    path("security/", include("apps.security.interfaces.api.urls")),
    path("webhooks/", include((webhook_urlpatterns, "webhooks"))),
    path("api-keys/", include((api_key_urlpatterns, "api-keys"))),
]

"""Core API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.core.interfaces.api.views import HealthCheckView

app_name = "core"

urlpatterns = [
    path("", HealthCheckView.as_view(), name="health"),
]

"""Dashboard API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.dashboard.interfaces.api.views import (
    ActivityView,
    NotificationListView,
    NotificationReadAllView,
    NotificationReadView,
    OverviewView,
    UsageView,
)

app_name = "dashboard"

urlpatterns = [
    path("overview/", OverviewView.as_view(), name="overview"),
    path("activity/", ActivityView.as_view(), name="activity"),
    path("usage/", UsageView.as_view(), name="usage"),
]

notification_urlpatterns = [
    path("", NotificationListView.as_view(), name="list"),
    path("read-all/", NotificationReadAllView.as_view(), name="read-all"),
    path("<uuid:notification_id>/read/", NotificationReadView.as_view(), name="read"),
]

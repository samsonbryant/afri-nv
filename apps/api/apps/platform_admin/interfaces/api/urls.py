"""Platform admin URL routes."""

from __future__ import annotations

from django.urls import path

from apps.platform_admin.interfaces.api.views import (
    AdminAiUsageView,
    AdminAnalyticsOverviewView,
    AdminAuditLogsView,
    AdminOrganizationsView,
    AdminPaymentsView,
    AdminSettingsView,
    AdminSubscriptionsView,
    AdminUserDetailView,
    AdminUsersView,
)

app_name = "platform_admin"

urlpatterns = [
    path("users/", AdminUsersView.as_view(), name="users"),
    path("users/<uuid:user_id>/", AdminUserDetailView.as_view(), name="user-detail"),
    path("organizations/", AdminOrganizationsView.as_view(), name="organizations"),
    path("subscriptions/", AdminSubscriptionsView.as_view(), name="subscriptions"),
    path("payments/", AdminPaymentsView.as_view(), name="payments"),
    path("analytics/overview/", AdminAnalyticsOverviewView.as_view(), name="analytics-overview"),
    path("ai-usage/", AdminAiUsageView.as_view(), name="ai-usage"),
    path("audit-logs/", AdminAuditLogsView.as_view(), name="audit-logs"),
    path("settings/", AdminSettingsView.as_view(), name="settings"),
]

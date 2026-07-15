from __future__ import annotations

from django.urls import path

from apps.analytics.interfaces.api.views import (
    AiUsageView,
    ArrView,
    ChurnView,
    MrrView,
    OverviewView,
    PerformanceView,
    RetentionView,
    RevenueView,
    SatisfactionView,
)

app_name = "analytics"

urlpatterns = [
    path("overview/", OverviewView.as_view(), name="overview"),
    path("revenue/", RevenueView.as_view(), name="revenue"),
    path("mrr/", MrrView.as_view(), name="mrr"),
    path("arr/", ArrView.as_view(), name="arr"),
    path("retention/", RetentionView.as_view(), name="retention"),
    path("churn/", ChurnView.as_view(), name="churn"),
    path("ai-usage/", AiUsageView.as_view(), name="ai-usage"),
    path("performance/", PerformanceView.as_view(), name="performance"),
    path("satisfaction/", SatisfactionView.as_view(), name="satisfaction"),
]

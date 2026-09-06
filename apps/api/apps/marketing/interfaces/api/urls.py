"""Marketing API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.marketing.interfaces.api.views import (
    AssetDetailView,
    AssetImproveView,
    AssetListCreateView,
    CampaignDetailView,
    CampaignListCreateView,
    FacebookAdListCreateView,
    FacebookAdMetricsView,
    GenerateView,
    SocialConnectionDetailView,
    SocialConnectionListCreateView,
    SocialPostListCreateView,
)

app_name = "marketing"

urlpatterns = [
    path("assets/", AssetListCreateView.as_view(), name="assets"),
    path("assets/<uuid:asset_id>/", AssetDetailView.as_view(), name="asset-detail"),
    path(
        "assets/<uuid:asset_id>/improve/",
        AssetImproveView.as_view(),
        name="asset-improve",
    ),
    path("generate/", GenerateView.as_view(), name="generate"),
    path("campaigns/", CampaignListCreateView.as_view(), name="campaigns"),
    path(
        "campaigns/<uuid:campaign_id>/",
        CampaignDetailView.as_view(),
        name="campaign-detail",
    ),
    path(
        "social/connections/", SocialConnectionListCreateView.as_view(), name="social-connections"
    ),
    path(
        "social/connections/<uuid:connection_id>/",
        SocialConnectionDetailView.as_view(),
        name="social-connection-detail",
    ),
    path("facebook/ads/", FacebookAdListCreateView.as_view(), name="facebook-ads"),
    path(
        "facebook/ads/<uuid:ad_id>/metrics/",
        FacebookAdMetricsView.as_view(),
        name="facebook-ad-metrics",
    ),
    path("social/posts/", SocialPostListCreateView.as_view(), name="social-posts"),
]

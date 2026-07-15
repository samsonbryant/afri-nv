"""Developer webhook/API key URL routes (mounted separately)."""

from __future__ import annotations

from django.urls import path

from apps.developer.interfaces.api.views import (
    ApiKeyDetailView,
    ApiKeyListCreateView,
    WebhookDetailView,
    WebhookListCreateView,
)

webhook_urlpatterns = [
    path("", WebhookListCreateView.as_view(), name="list-create"),
    path("<uuid:endpoint_id>/", WebhookDetailView.as_view(), name="detail"),
]

api_key_urlpatterns = [
    path("", ApiKeyListCreateView.as_view(), name="list-create"),
    path("<uuid:key_id>/", ApiKeyDetailView.as_view(), name="detail"),
]

"""Organization API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.organizations.interfaces.api.views import (
    MembershipDetailView,
    MembershipListCreateView,
    OrganizationDetailView,
    OrganizationListCreateView,
)

app_name = "organizations"

urlpatterns = [
    path("", OrganizationListCreateView.as_view(), name="list-create"),
    path("<uuid:org_id>/", OrganizationDetailView.as_view(), name="detail"),
    path(
        "<uuid:org_id>/memberships/",
        MembershipListCreateView.as_view(),
        name="memberships",
    ),
    path(
        "<uuid:org_id>/memberships/<uuid:membership_id>/",
        MembershipDetailView.as_view(),
        name="membership-detail",
    ),
]

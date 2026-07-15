"""Dashboard dependency injection."""

from __future__ import annotations

from apps.dashboard.application.services import DashboardService
from apps.organizations.infrastructure.repositories import (
    DjangoMembershipRepository,
    DjangoOrganizationRepository,
)


def get_dashboard_service() -> DashboardService:
    return DashboardService(
        org_repository=DjangoOrganizationRepository(),
        membership_repository=DjangoMembershipRepository(),
    )

"""Organizations dependency injection."""

from __future__ import annotations

from apps.organizations.application.services import OrganizationService
from apps.organizations.infrastructure.repositories import (
    DjangoMembershipRepository,
    DjangoOrganizationRepository,
)


def get_organization_repository() -> DjangoOrganizationRepository:
    return DjangoOrganizationRepository()


def get_membership_repository() -> DjangoMembershipRepository:
    return DjangoMembershipRepository()


def get_organization_service() -> OrganizationService:
    return OrganizationService(
        org_repository=get_organization_repository(),
        membership_repository=get_membership_repository(),
    )

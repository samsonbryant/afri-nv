"""CRM dependency injection."""

from __future__ import annotations

from apps.crm.application.services import CrmService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_crm_service() -> CrmService:
    return CrmService(membership_repository=DjangoMembershipRepository())

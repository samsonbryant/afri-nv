"""Support dependency injection."""

from __future__ import annotations

from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from apps.support.application.services import SupportService


def get_support_service() -> SupportService:
    return SupportService(membership_repository=DjangoMembershipRepository())

"""Marketing DI wiring."""

from __future__ import annotations

from apps.marketing.application.services import MarketingService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_marketing_service() -> MarketingService:
    return MarketingService(membership_repository=DjangoMembershipRepository())

"""Assistant dependency injection."""

from __future__ import annotations

from apps.assistant.application.services import AssistantService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_assistant_service() -> AssistantService:
    return AssistantService(membership_repository=DjangoMembershipRepository())

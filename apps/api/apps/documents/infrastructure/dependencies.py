"""Documents DI wiring."""

from __future__ import annotations

from apps.documents.application.services import DocumentStudioService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_document_studio_service() -> DocumentStudioService:
    return DocumentStudioService(membership_repository=DjangoMembershipRepository())

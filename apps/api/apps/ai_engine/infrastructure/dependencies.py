"""AI engine dependency injection."""

from __future__ import annotations

from apps.ai_engine.application.services import DocumentService
from apps.ai_engine.infrastructure.repositories import DjangoDocumentRepository
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from infrastructure.vector.embeddings import get_embedding_service


def get_document_repository() -> DjangoDocumentRepository:
    return DjangoDocumentRepository()


def get_document_service() -> DocumentService:
    return DocumentService(
        document_repository=get_document_repository(),
        membership_repository=DjangoMembershipRepository(),
        embedding_service=get_embedding_service(),
    )

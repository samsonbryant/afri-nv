"""Knowledge dependency injection."""

from __future__ import annotations

from apps.knowledge.application.ingestion import DocumentIngestionService
from apps.knowledge.application.services import KnowledgeService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from infrastructure.vector.embeddings import get_embedding_service


def get_knowledge_service() -> KnowledgeService:
    embeddings = get_embedding_service()
    return KnowledgeService(
        membership_repository=DjangoMembershipRepository(),
        embedding_service=embeddings,
        ingestion_service=DocumentIngestionService(embeddings),
    )

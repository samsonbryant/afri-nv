"""AI engine application services."""

from __future__ import annotations

from uuid import UUID

from apps.ai_engine.application.dto import (
    CreateDocumentDTO,
    DocumentDTO,
    SearchDocumentsDTO,
    SearchHitDTO,
)
from apps.ai_engine.domain.entities import DocumentEntity
from apps.ai_engine.domain.exceptions import DocumentNotFoundError, EmptyContentError
from apps.ai_engine.domain.repositories import AbstractDocumentRepository
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from infrastructure.vector.embeddings import EmbeddingService


class DocumentService:
    def __init__(
        self,
        document_repository: AbstractDocumentRepository,
        membership_repository: AbstractMembershipRepository,
        embedding_service: EmbeddingService,
    ) -> None:
        self._documents = document_repository
        self._memberships = membership_repository
        self._embeddings = embedding_service

    def create(self, actor_id: UUID, data: CreateDocumentDTO) -> DocumentDTO:
        self._require_member(actor_id, data.organization_id)
        if not data.content.strip():
            raise EmptyContentError()
        embedding = self._embeddings.embed(data.content)
        document = self._documents.create(
            organization_id=data.organization_id,
            title=data.title,
            content=data.content,
            source=data.source,
            metadata=data.metadata,
            embedding=embedding,
            created_by_id=actor_id,
        )
        return self._to_dto(document)

    def list_for_organization(self, actor_id: UUID, organization_id: UUID) -> list[DocumentDTO]:
        self._require_member(actor_id, organization_id)
        return [self._to_dto(d) for d in self._documents.list_for_organization(organization_id)]

    def get(self, actor_id: UUID, document_id: UUID) -> DocumentDTO:
        document = self._get_or_404(document_id)
        self._require_member(actor_id, document.organization_id)
        return self._to_dto(document)

    def delete(self, actor_id: UUID, document_id: UUID) -> None:
        document = self._get_or_404(document_id)
        self._require_member(actor_id, document.organization_id)
        self._documents.delete(document_id)

    def search(self, actor_id: UUID, data: SearchDocumentsDTO) -> list[SearchHitDTO]:
        self._require_member(actor_id, data.organization_id)
        if not data.query.strip():
            raise EmptyContentError("Search query cannot be empty.")
        query_embedding = self._embeddings.embed(data.query)
        results = self._documents.similarity_search(
            data.organization_id,
            query_embedding,
            limit=data.limit,
        )
        return [SearchHitDTO(document=self._to_dto(r.document), score=r.score) for r in results]

    def _get_or_404(self, document_id: UUID) -> DocumentEntity:
        document = self._documents.get_by_id(document_id)
        if document is None:
            raise DocumentNotFoundError()
        return document

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    @staticmethod
    def _to_dto(document: DocumentEntity) -> DocumentDTO:
        return DocumentDTO(
            id=document.id,
            organization_id=document.organization_id,
            title=document.title,
            content=document.content,
            source=document.source,
            metadata=document.metadata,
            has_embedding=bool(document.embedding),
            created_by_id=document.created_by_id,
            created_at=document.created_at,
            updated_at=document.updated_at,
        )

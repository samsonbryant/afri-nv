"""AI engine repository interfaces."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from apps.ai_engine.domain.entities import DocumentEntity, SimilarityResult


class AbstractDocumentRepository(ABC):
    @abstractmethod
    def get_by_id(self, document_id: UUID) -> DocumentEntity | None: ...

    @abstractmethod
    def list_for_organization(self, organization_id: UUID) -> list[DocumentEntity]: ...

    @abstractmethod
    def create(
        self,
        *,
        organization_id: UUID,
        title: str,
        content: str,
        source: str,
        metadata: dict[str, Any],
        embedding: list[float] | None,
        created_by_id: UUID | None,
    ) -> DocumentEntity: ...

    @abstractmethod
    def update(self, document: DocumentEntity) -> DocumentEntity: ...

    @abstractmethod
    def delete(self, document_id: UUID) -> None: ...

    @abstractmethod
    def similarity_search(
        self,
        organization_id: UUID,
        query_embedding: list[float],
        *,
        limit: int = 5,
    ) -> list[SimilarityResult]: ...

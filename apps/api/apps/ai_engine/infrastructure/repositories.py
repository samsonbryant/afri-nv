"""Django document repository with cosine / pgvector similarity search."""

from __future__ import annotations

import math
from typing import Any
from uuid import UUID

from apps.ai_engine.domain.entities import DocumentEntity, SimilarityResult
from apps.ai_engine.domain.repositories import AbstractDocumentRepository
from apps.ai_engine.infrastructure.models import _USE_PGVECTOR, Document


class DjangoDocumentRepository(AbstractDocumentRepository):
    def get_by_id(self, document_id: UUID) -> DocumentEntity | None:
        try:
            document = Document.objects.get(pk=document_id)
        except Document.DoesNotExist:
            return None
        return self._to_entity(document)

    def list_for_organization(self, organization_id: UUID) -> list[DocumentEntity]:
        qs = Document.objects.filter(organization_id=organization_id)
        return [self._to_entity(d) for d in qs]

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
    ) -> DocumentEntity:
        document = Document.objects.create(
            organization_id=organization_id,
            title=title,
            content=content,
            source=source,
            metadata=metadata,
            embedding=embedding,
            created_by_id=created_by_id,
        )
        return self._to_entity(document)

    def update(self, document: DocumentEntity) -> DocumentEntity:
        orm = Document.objects.get(pk=document.id)
        orm.title = document.title
        orm.content = document.content
        orm.source = document.source
        orm.metadata = document.metadata
        orm.embedding = document.embedding
        orm.save(
            update_fields=[
                "title",
                "content",
                "source",
                "metadata",
                "embedding",
                "updated_at",
            ]
        )
        return self._to_entity(orm)

    def delete(self, document_id: UUID) -> None:
        Document.objects.filter(pk=document_id).delete()

    def similarity_search(
        self,
        organization_id: UUID,
        query_embedding: list[float],
        *,
        limit: int = 5,
    ) -> list[SimilarityResult]:
        if _USE_PGVECTOR:
            return self._pgvector_search(organization_id, query_embedding, limit=limit)
        return self._python_search(organization_id, query_embedding, limit=limit)

    def _python_search(
        self,
        organization_id: UUID,
        query_embedding: list[float],
        *,
        limit: int,
    ) -> list[SimilarityResult]:
        qs = Document.objects.filter(
            organization_id=organization_id,
            embedding__isnull=False,
        )
        scored: list[SimilarityResult] = []
        for doc in qs:
            emb = doc.embedding
            if not emb:
                continue
            score = self._cosine_similarity(query_embedding, list(emb))
            scored.append(SimilarityResult(document=self._to_entity(doc), score=score))
        scored.sort(key=lambda item: item.score, reverse=True)
        return scored[:limit]

    def _pgvector_search(
        self,
        organization_id: UUID,
        query_embedding: list[float],
        *,
        limit: int,
    ) -> list[SimilarityResult]:
        from pgvector.django import CosineDistance

        qs = (
            Document.objects.filter(
                organization_id=organization_id,
                embedding__isnull=False,
            )
            .annotate(distance=CosineDistance("embedding", query_embedding))
            .order_by("distance")[:limit]
        )
        results: list[SimilarityResult] = []
        for doc in qs:
            distance = float(getattr(doc, "distance", 1.0))
            results.append(SimilarityResult(document=self._to_entity(doc), score=1.0 - distance))
        return results

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b, strict=True))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    @staticmethod
    def _to_entity(document: Document) -> DocumentEntity:
        embedding = document.embedding
        if embedding is not None:
            embedding = list(embedding)
        return DocumentEntity(
            id=document.id,
            organization_id=document.organization_id,
            title=document.title,
            content=document.content,
            source=document.source,
            metadata=document.metadata or {},
            embedding=embedding,
            created_by_id=document.created_by_id,
            created_at=document.created_at,
            updated_at=document.updated_at,
        )

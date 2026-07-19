"""Knowledge application services."""

from __future__ import annotations

import logging
import math
from uuid import UUID

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.utils import timezone

from apps.knowledge.application.dto import (
    CreateConversationDTO,
    KnowledgeChunkDTO,
    KnowledgeConversationDTO,
    KnowledgeDocumentDTO,
    KnowledgeMessageDTO,
    SendKnowledgeMessageDTO,
    SendMessageResultDTO,
)
from apps.knowledge.application.ingestion import DocumentIngestionService
from apps.knowledge.domain.exceptions import (
    EmptyKnowledgeMessageError,
    KnowledgeConversationNotFoundError,
    KnowledgeDocumentNotFoundError,
)
from apps.knowledge.infrastructure.models import (
    KnowledgeChunk,
    KnowledgeConversation,
    KnowledgeDocument,
    KnowledgeMessage,
)
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from infrastructure.ai.llm import complete
from infrastructure.vector.embeddings import EmbeddingService, get_embedding_service

logger = logging.getLogger("apps.knowledge")


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


class KnowledgeService:
    def __init__(
        self,
        membership_repository: AbstractMembershipRepository,
        embedding_service: EmbeddingService | None = None,
        ingestion_service: DocumentIngestionService | None = None,
    ) -> None:
        self._memberships = membership_repository
        self._embeddings = embedding_service or get_embedding_service()
        self._ingestion = ingestion_service or DocumentIngestionService(self._embeddings)

    # ── Documents ──────────────────────────────────────────────

    def list_documents(self, actor_id: UUID, organization_id: UUID) -> list[KnowledgeDocumentDTO]:
        self._require_member(actor_id, organization_id)
        qs = KnowledgeDocument.objects.filter(organization_id=organization_id)
        return [self._document_dto(d) for d in qs]

    def upload_document(
        self,
        actor_id: UUID,
        organization_id: UUID,
        title: str,
        uploaded: UploadedFile | None = None,
    ) -> KnowledgeDocumentDTO:
        self._require_member(actor_id, organization_id)
        doc = KnowledgeDocument.objects.create(
            organization_id=organization_id,
            title=title or (uploaded.name if uploaded else "Untitled"),
            created_by_id=actor_id,
            status=KnowledgeDocument.Status.PENDING,
        )
        if uploaded:
            doc.file = uploaded
            doc.save(update_fields=["file", "updated_at"])
        self._enqueue_process(doc.id)
        doc.refresh_from_db()
        return self._document_dto(doc)

    def get_document(self, actor_id: UUID, document_id: UUID) -> KnowledgeDocumentDTO:
        doc = self._get_document(document_id)
        self._require_member(actor_id, doc.organization_id)
        return self._document_dto(doc)

    def delete_document(self, actor_id: UUID, document_id: UUID) -> None:
        doc = self._get_document(document_id)
        self._require_member(actor_id, doc.organization_id)
        doc.delete()

    def reprocess_document(self, actor_id: UUID, document_id: UUID) -> KnowledgeDocumentDTO:
        doc = self._get_document(document_id)
        self._require_member(actor_id, doc.organization_id)
        doc.status = KnowledgeDocument.Status.PENDING
        doc.error_message = ""
        doc.save(update_fields=["status", "error_message", "updated_at"])
        self._enqueue_process(doc.id)
        doc.refresh_from_db()
        return self._document_dto(doc)

    def list_chunks(self, actor_id: UUID, document_id: UUID) -> list[KnowledgeChunkDTO]:
        doc = self._get_document(document_id)
        self._require_member(actor_id, doc.organization_id)
        return [
            KnowledgeChunkDTO(
                id=c.id,
                document_id=c.document_id,
                index=c.index,
                content=c.content,
                metadata=c.metadata or {},
                created_at=c.created_at,
            )
            for c in KnowledgeChunk.objects.filter(document=doc)
        ]

    def process_document(self, document_id: str | UUID) -> KnowledgeDocumentDTO:
        """Called by Celery (or eagerly) to run ingestion."""
        doc = self._ingestion.process(str(document_id))
        return self._document_dto(doc)

    def _enqueue_process(self, document_id: UUID) -> None:
        from infrastructure.celery.tasks import process_knowledge_document

        doc_id = str(document_id)
        if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
            self.process_document(doc_id)
            return

        def _enqueue() -> None:
            try:
                process_knowledge_document.delay(doc_id)
            except Exception:
                self.process_document(doc_id)

        transaction.on_commit(_enqueue)

    # ── Conversations / RAG ────────────────────────────────────

    def list_conversations(
        self, actor_id: UUID, organization_id: UUID
    ) -> list[KnowledgeConversationDTO]:
        self._require_member(actor_id, organization_id)
        qs = KnowledgeConversation.objects.filter(organization_id=organization_id, user_id=actor_id)
        return [self._conversation_dto(c) for c in qs]

    def create_conversation(
        self, actor_id: UUID, data: CreateConversationDTO
    ) -> KnowledgeConversationDTO:
        self._require_member(actor_id, data.organization_id)
        conversation = KnowledgeConversation.objects.create(
            organization_id=data.organization_id,
            user_id=actor_id,
            title=data.title or "New conversation",
        )
        return self._conversation_dto(conversation)

    def list_messages(self, actor_id: UUID, conversation_id: UUID) -> list[KnowledgeMessageDTO]:
        conversation = self._get_owned_conversation(actor_id, conversation_id)
        return [
            self._message_dto(m) for m in KnowledgeMessage.objects.filter(conversation=conversation)
        ]

    def send_message(
        self, actor_id: UUID, conversation_id: UUID, data: SendKnowledgeMessageDTO
    ) -> SendMessageResultDTO:
        conversation = self._get_owned_conversation(actor_id, conversation_id)
        if not data.content.strip():
            raise EmptyKnowledgeMessageError()

        user_message = KnowledgeMessage.objects.create(
            conversation=conversation,
            role=KnowledgeMessage.Role.USER,
            content=data.content,
            citations=[],
        )

        chunks = self._retrieve_chunks(conversation.organization_id, data.content)
        citations = [
            {
                "chunk_id": str(c.id),
                "document_id": str(c.document_id),
                "index": c.index,
                "snippet": c.content[:240],
            }
            for c in chunks
        ]
        context = (
            "\n\n".join(f"[{i + 1}] {c.content}" for i, c in enumerate(chunks))
            or "(No knowledge chunks available.)"
        )
        answer = complete(
            f"Question: {data.content}\n\nContext:\n{context}\n\n"
            "Answer using the context. Cite sources as [1], [2], etc.",
            system=(
                "You are a knowledge-base assistant for Novixa. "
                "Answer only from the provided context when possible."
            ),
        )

        assistant_message = KnowledgeMessage.objects.create(
            conversation=conversation,
            role=KnowledgeMessage.Role.ASSISTANT,
            content=answer,
            citations=citations,
        )
        conversation.updated_at = timezone.now()
        if conversation.title == "New conversation":
            conversation.title = data.content.strip()[:80]
        conversation.save(update_fields=["title", "updated_at"])

        return SendMessageResultDTO(
            user_message=self._message_dto(user_message),
            assistant_message=self._message_dto(assistant_message),
            citations=citations,
        )

    def _retrieve_chunks(
        self, organization_id: UUID, query: str, limit: int = 5
    ) -> list[KnowledgeChunk]:
        query_embedding = self._embeddings.embed(query)
        candidates = list(
            KnowledgeChunk.objects.filter(
                document__organization_id=organization_id,
                document__status=KnowledgeDocument.Status.READY,
            ).select_related("document")[:200]
        )
        if not candidates:
            return []
        scored = []
        for chunk in candidates:
            emb = chunk.embedding
            if isinstance(emb, list) and emb:
                scored.append((_cosine(query_embedding, emb), chunk))
            else:
                # Fallback lexical overlap when embedding missing
                q_terms = set(query.lower().split())
                c_terms = set(chunk.content.lower().split())
                overlap = len(q_terms & c_terms) / max(1, len(q_terms))
                scored.append((overlap, chunk))
        scored.sort(key=lambda item: item[0], reverse=True)
        return [c for _, c in scored[:limit]]

    # ── Helpers ────────────────────────────────────────────────

    def _get_document(self, document_id: UUID) -> KnowledgeDocument:
        try:
            return KnowledgeDocument.objects.get(pk=document_id)
        except KnowledgeDocument.DoesNotExist as exc:
            raise KnowledgeDocumentNotFoundError() from exc

    def _get_owned_conversation(
        self, actor_id: UUID, conversation_id: UUID
    ) -> KnowledgeConversation:
        try:
            conversation = KnowledgeConversation.objects.get(pk=conversation_id)
        except KnowledgeConversation.DoesNotExist as exc:
            raise KnowledgeConversationNotFoundError() from exc
        if conversation.user_id != actor_id:
            raise KnowledgeConversationNotFoundError()
        self._require_member(actor_id, conversation.organization_id)
        return conversation

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    @staticmethod
    def _document_dto(d: KnowledgeDocument) -> KnowledgeDocumentDTO:
        file_url = None
        if d.file:
            try:
                file_url = d.file.url
            except Exception:
                file_url = None
        return KnowledgeDocumentDTO(
            id=d.id,
            organization_id=d.organization_id,
            title=d.title,
            file_type=d.file_type,
            status=d.status,
            page_count=d.page_count,
            chunk_count=d.chunk_count,
            error_message=d.error_message,
            metadata=d.metadata or {},
            created_by_id=d.created_by_id,
            created_at=d.created_at,
            updated_at=d.updated_at,
            file_url=file_url,
        )

    @staticmethod
    def _conversation_dto(c: KnowledgeConversation) -> KnowledgeConversationDTO:
        return KnowledgeConversationDTO(
            id=c.id,
            organization_id=c.organization_id,
            user_id=c.user_id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

    @staticmethod
    def _message_dto(m: KnowledgeMessage) -> KnowledgeMessageDTO:
        return KnowledgeMessageDTO(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            citations=m.citations or [],
            created_at=m.created_at,
        )

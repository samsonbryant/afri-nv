"""Knowledge DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class KnowledgeDocumentDTO:
    id: UUID
    organization_id: UUID
    title: str
    file_type: str
    status: str
    page_count: int
    chunk_count: int
    error_message: str
    metadata: dict
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime
    file_url: str | None = None


@dataclass(slots=True)
class KnowledgeChunkDTO:
    id: UUID
    document_id: UUID
    index: int
    content: str
    metadata: dict
    created_at: datetime


@dataclass(slots=True)
class KnowledgeConversationDTO:
    id: UUID
    organization_id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class KnowledgeMessageDTO:
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    citations: list
    created_at: datetime


@dataclass(slots=True)
class SendKnowledgeMessageDTO:
    content: str


@dataclass(slots=True)
class CreateConversationDTO:
    organization_id: UUID
    title: str = "New conversation"


@dataclass(slots=True)
class SendMessageResultDTO:
    user_message: KnowledgeMessageDTO
    assistant_message: KnowledgeMessageDTO
    citations: list = field(default_factory=list)

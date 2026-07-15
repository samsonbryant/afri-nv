"""Assistant DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class CreateConversationDTO:
    organization_id: UUID
    title: str = "New conversation"


@dataclass(slots=True)
class UpdateConversationDTO:
    title: str | None = None


@dataclass(slots=True)
class ConversationDTO:
    id: UUID
    organization_id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class SendMessageDTO:
    content: str
    content_type: str = "markdown"
    attachments: list = field(default_factory=list)


@dataclass(slots=True)
class MessageDTO:
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    content_type: str
    attachments: list
    citations: list
    created_at: datetime


@dataclass(slots=True)
class SendMessageResultDTO:
    user_message: MessageDTO
    assistant_message: MessageDTO


@dataclass(slots=True)
class UploadResultDTO:
    url: str
    name: str
    content_type: str
    size: int

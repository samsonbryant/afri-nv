"""Assistant domain entities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class ConversationEntity:
    id: UUID
    organization_id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class MessageEntity:
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    content_type: str
    attachments: list
    citations: list
    created_at: datetime

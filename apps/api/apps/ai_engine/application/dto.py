"""AI engine application DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID


@dataclass(slots=True)
class CreateDocumentDTO:
    organization_id: UUID
    title: str
    content: str
    source: str = "manual"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class DocumentDTO:
    id: UUID
    organization_id: UUID
    title: str
    content: str
    source: str
    metadata: dict[str, Any]
    has_embedding: bool
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class SearchDocumentsDTO:
    organization_id: UUID
    query: str
    limit: int = 5


@dataclass(slots=True)
class SearchHitDTO:
    document: DocumentDTO
    score: float

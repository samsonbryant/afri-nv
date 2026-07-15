"""AI engine domain entities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID


@dataclass(slots=True)
class DocumentEntity:
    id: UUID
    organization_id: UUID
    title: str
    content: str
    source: str
    metadata: dict[str, Any]
    embedding: list[float] | None
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class SimilarityResult:
    document: DocumentEntity
    score: float

"""Documents DTOs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class StudioDocumentDTO:
    id: UUID
    organization_id: UUID
    title: str
    file_type: str
    extracted_text: str
    status: str
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime
    file_url: str | None = None


@dataclass(slots=True)
class DocumentJobDTO:
    id: UUID
    document_id: UUID
    job_type: str
    status: str
    params: dict
    result: dict
    error: str
    created_at: datetime
    updated_at: datetime

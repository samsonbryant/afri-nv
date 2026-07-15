"""Reports DTOs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass(slots=True)
class ReportDTO:
    id: UUID
    organization_id: UUID
    type: str
    title: str
    period_start: date | None
    period_end: date | None
    status: str
    content: dict
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime

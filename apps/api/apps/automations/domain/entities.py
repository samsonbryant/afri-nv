"""Automation domain entities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID


class AutomationRunStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(slots=True)
class AutomationRunEntity:
    id: UUID
    workflow_id: UUID
    organization_id: UUID
    status: str
    input_payload: dict[str, Any]
    output_payload: dict[str, Any]
    error_message: str
    triggered_by_id: UUID | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime

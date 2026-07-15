"""Automation application DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID


@dataclass(slots=True)
class TriggerAutomationDTO:
    workflow_id: UUID
    input_payload: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class AutomationRunDTO:
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

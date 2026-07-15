"""Workflow application DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID


@dataclass(slots=True)
class CreateWorkflowDTO:
    organization_id: UUID
    name: str
    description: str = ""
    definition: dict[str, Any] = field(default_factory=dict)
    status: str = "draft"


@dataclass(slots=True)
class UpdateWorkflowDTO:
    name: str | None = None
    description: str | None = None
    definition: dict[str, Any] | None = None
    status: str | None = None


@dataclass(slots=True)
class WorkflowDTO:
    id: UUID
    organization_id: UUID
    name: str
    description: str
    definition: dict[str, Any]
    status: str
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime

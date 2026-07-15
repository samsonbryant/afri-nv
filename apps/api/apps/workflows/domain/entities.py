"""Workflow domain entities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID


class WorkflowStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


@dataclass(slots=True)
class WorkflowEntity:
    id: UUID
    organization_id: UUID
    name: str
    description: str
    definition: dict[str, Any]
    status: str
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime

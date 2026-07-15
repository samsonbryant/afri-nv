from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class AgentDTO:
    id: UUID
    organization_id: UUID
    type: str
    name: str
    description: str
    system_prompt: str
    tools: list
    is_active: bool
    config: dict
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class AgentRunDTO:
    id: UUID
    agent_id: UUID
    user_id: UUID | None
    input: str
    output: str
    status: str
    tokens_used: int
    citations: list
    created_at: datetime
    updated_at: datetime

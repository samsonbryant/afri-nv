"""Dashboard domain entities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass(slots=True)
class NotificationEntity:
    id: UUID
    user_id: UUID
    organization_id: UUID | None
    title: str
    body: str
    type: str
    link: str
    read_at: datetime | None
    created_at: datetime


@dataclass(slots=True)
class OverviewKPI:
    workflows_count: int
    automations_count: int
    ai_documents_count: int
    ai_tokens_used: int
    members_count: int
    plan: str
    subscription_status: str


@dataclass(slots=True)
class ActivityItem:
    id: str
    type: str
    title: str
    description: str
    created_at: datetime
    actor_id: UUID | None = None
    link: str = ""


@dataclass(slots=True)
class UsagePoint:
    date: date
    automations: int
    ai_tokens: int

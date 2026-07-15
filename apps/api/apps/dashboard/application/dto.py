"""Dashboard DTOs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from apps.dashboard.domain.entities import ActivityItem, OverviewKPI, UsagePoint


@dataclass(slots=True)
class NotificationDTO:
    id: UUID
    user_id: UUID
    organization_id: UUID | None
    title: str
    body: str
    type: str
    link: str
    read_at: datetime | None
    created_at: datetime
    is_read: bool


@dataclass(slots=True)
class OverviewDTO:
    kpis: OverviewKPI


@dataclass(slots=True)
class ActivityFeedDTO:
    items: list[ActivityItem]


@dataclass(slots=True)
class UsageSeriesDTO:
    days: int
    points: list[UsagePoint]

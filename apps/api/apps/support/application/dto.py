"""Support DTOs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class ChannelDTO:
    id: UUID
    organization_id: UUID
    type: str
    name: str
    config: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class TicketDTO:
    id: UUID
    organization_id: UUID
    channel_id: UUID | None
    subject: str
    description: str
    status: str
    priority: str
    requester_email: str
    requester_name: str
    assignee_id: UUID | None
    tags: list
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class TicketMessageDTO:
    id: UUID
    ticket_id: UUID
    sender_type: str
    body: str
    attachments: list
    is_internal: bool
    created_at: datetime


@dataclass(slots=True)
class SupportStatsDTO:
    total: int
    open: int
    pending: int
    resolved: int
    closed: int
    by_priority: dict

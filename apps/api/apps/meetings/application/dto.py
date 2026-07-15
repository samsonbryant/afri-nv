"""Meetings DTOs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class MeetingDTO:
    id: UUID
    organization_id: UUID
    title: str
    description: str
    starts_at: datetime
    ends_at: datetime
    timezone: str
    location: str
    meeting_url: str
    provider: str
    status: str
    organizer_id: UUID | None
    attendees: list
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class CalendarConnectionDTO:
    id: UUID
    organization_id: UUID
    user_id: UUID
    provider: str
    status: str
    metadata: dict
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class BookingLinkDTO:
    id: UUID
    organization_id: UUID
    user_id: UUID
    slug: str
    duration_minutes: int
    buffer_minutes: int
    availability: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class BookingDTO:
    id: UUID
    booking_link_id: UUID
    invitee_name: str
    invitee_email: str
    starts_at: datetime
    ends_at: datetime
    status: str
    meeting_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class ReminderDTO:
    id: UUID
    meeting_id: UUID
    remind_at: datetime
    channel: str
    sent_at: datetime | None
    created_at: datetime
    updated_at: datetime

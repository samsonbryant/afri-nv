"""Meetings domain enums."""

from __future__ import annotations

from enum import StrEnum


class CalendarProvider(StrEnum):
    GOOGLE = "google"
    MICROSOFT = "microsoft"


class CalendarConnectionStatus(StrEnum):
    ACTIVE = "active"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"


class MeetingProvider(StrEnum):
    ZOOM = "zoom"
    GOOGLE_MEET = "google_meet"
    TEAMS = "teams"
    IN_PERSON = "in_person"
    OTHER = "other"


class MeetingStatus(StrEnum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingStatus(StrEnum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    PENDING = "pending"


class ReminderChannel(StrEnum):
    EMAIL = "email"
    IN_APP = "in_app"

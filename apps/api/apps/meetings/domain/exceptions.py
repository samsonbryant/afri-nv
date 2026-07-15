"""Meetings domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class MeetingNotFoundError(NotFoundError):
    default_message = "Meeting not found."
    code = "meeting_not_found"


class BookingLinkNotFoundError(NotFoundError):
    default_message = "Booking link not found."
    code = "booking_link_not_found"


class BookingNotFoundError(NotFoundError):
    default_message = "Booking not found."
    code = "booking_not_found"


class CalendarConnectionNotFoundError(NotFoundError):
    default_message = "Calendar connection not found."
    code = "calendar_connection_not_found"


class ReminderNotFoundError(NotFoundError):
    default_message = "Meeting reminder not found."
    code = "reminder_not_found"


class InvalidCalendarProviderError(ValidationError):
    default_message = "Invalid calendar provider."
    code = "invalid_calendar_provider"

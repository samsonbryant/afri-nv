"""Meetings ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class CalendarConnection(BaseModel):
    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"
        MICROSOFT = "microsoft", "Microsoft"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        DISCONNECTED = "disconnected", "Disconnected"
        ERROR = "error", "Error"
        PENDING = "pending", "Pending"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="calendar_connections",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calendar_connections",
    )
    provider = models.CharField(max_length=32, choices=Provider.choices, db_index=True)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    access_token = models.CharField(max_length=1024, blank=True, default="")
    refresh_token = models.CharField(max_length=1024, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "meetings_calendar_connection"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "provider"])]

    def __str__(self) -> str:
        return f"{self.provider}:{self.user_id}"


class Meeting(BaseModel):
    class Provider(models.TextChoices):
        ZOOM = "zoom", "Zoom"
        GOOGLE_MEET = "google_meet", "Google Meet"
        TEAMS = "teams", "Microsoft Teams"
        IN_PERSON = "in_person", "In Person"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="meetings",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField()
    timezone = models.CharField(max_length=64, default="UTC")
    location = models.CharField(max_length=512, blank=True, default="")
    meeting_url = models.URLField(blank=True, default="")
    provider = models.CharField(
        max_length=32, choices=Provider.choices, default=Provider.OTHER, db_index=True
    )
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.SCHEDULED, db_index=True
    )
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organized_meetings",
    )
    attendees = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "meetings_meeting"
        ordering = ("-starts_at",)
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self) -> str:
        return self.title


class BookingLink(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="booking_links",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="booking_links",
    )
    slug = models.SlugField(max_length=128, unique=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    buffer_minutes = models.PositiveIntegerField(default=0)
    availability = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "meetings_booking_link"
        ordering = ("slug",)
        indexes = [models.Index(fields=["organization", "is_active"])]

    def __str__(self) -> str:
        return self.slug


class Booking(BaseModel):
    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        PENDING = "pending", "Pending"

    booking_link = models.ForeignKey(BookingLink, on_delete=models.CASCADE, related_name="bookings")
    invitee_name = models.CharField(max_length=255)
    invitee_email = models.EmailField()
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField()
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.CONFIRMED, db_index=True
    )
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookings",
    )

    class Meta:
        db_table = "meetings_booking"
        ordering = ("-starts_at",)

    def __str__(self) -> str:
        return f"{self.invitee_email}@{self.starts_at}"


class MeetingReminder(BaseModel):
    class Channel(models.TextChoices):
        EMAIL = "email", "Email"
        IN_APP = "in_app", "In App"

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="reminders")
    remind_at = models.DateTimeField(db_index=True)
    channel = models.CharField(max_length=16, choices=Channel.choices, default=Channel.EMAIL)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "meetings_reminder"
        ordering = ("remind_at",)

    def __str__(self) -> str:
        return f"{self.meeting_id}:{self.channel}"

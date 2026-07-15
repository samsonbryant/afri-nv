"""Meetings application services."""

from __future__ import annotations

from datetime import timedelta
from uuid import UUID, uuid4

from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify

from apps.meetings.application.dto import (
    BookingDTO,
    BookingLinkDTO,
    CalendarConnectionDTO,
    MeetingDTO,
    ReminderDTO,
)
from apps.meetings.domain.entities import CalendarProvider
from apps.meetings.domain.exceptions import (
    BookingLinkNotFoundError,
    CalendarConnectionNotFoundError,
    InvalidCalendarProviderError,
    MeetingNotFoundError,
    ReminderNotFoundError,
)
from apps.meetings.infrastructure.models import (
    Booking,
    BookingLink,
    CalendarConnection,
    Meeting,
    MeetingReminder,
)
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from infrastructure.security.crypto import encrypt_value


class MeetingService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    # Meetings CRUD
    def list_meetings(self, actor_id: UUID, organization_id: UUID) -> list[MeetingDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._meeting_dto(m) for m in Meeting.objects.filter(organization_id=organization_id)
        ]

    def create_meeting(self, actor_id: UUID, organization_id: UUID, data: dict) -> MeetingDTO:
        self._require_member(actor_id, organization_id)
        meeting = Meeting.objects.create(
            organization_id=organization_id,
            title=data["title"],
            description=data.get("description", ""),
            starts_at=data["starts_at"],
            ends_at=data["ends_at"],
            timezone=data.get("timezone", "UTC"),
            location=data.get("location", ""),
            meeting_url=data.get("meeting_url", ""),
            provider=data.get("provider", Meeting.Provider.OTHER),
            status=data.get("status", Meeting.Status.SCHEDULED),
            organizer_id=data.get("organizer_id") or actor_id,
            attendees=data.get("attendees") or [],
        )
        return self._meeting_dto(meeting)

    def get_meeting(self, actor_id: UUID, meeting_id: UUID) -> MeetingDTO:
        meeting = self._get_meeting(meeting_id)
        self._require_member(actor_id, meeting.organization_id)
        return self._meeting_dto(meeting)

    def update_meeting(self, actor_id: UUID, meeting_id: UUID, data: dict) -> MeetingDTO:
        meeting = self._get_meeting(meeting_id)
        self._require_member(actor_id, meeting.organization_id)
        for key in (
            "title",
            "description",
            "starts_at",
            "ends_at",
            "timezone",
            "location",
            "meeting_url",
            "provider",
            "status",
            "organizer_id",
            "attendees",
        ):
            if key in data:
                setattr(meeting, key, data[key])
        meeting.save()
        return self._meeting_dto(meeting)

    def delete_meeting(self, actor_id: UUID, meeting_id: UUID) -> None:
        meeting = self._get_meeting(meeting_id)
        self._require_member(actor_id, meeting.organization_id)
        meeting.delete()

    def create_meeting_link(self, actor_id: UUID, meeting_id: UUID) -> MeetingDTO:
        meeting = self._get_meeting(meeting_id)
        self._require_member(actor_id, meeting.organization_id)
        stub_id = uuid4().hex[:10]
        urls = {
            Meeting.Provider.ZOOM: f"https://zoom.us/j/stub-{stub_id}",
            Meeting.Provider.GOOGLE_MEET: f"https://meet.google.com/stub-{stub_id}",
            Meeting.Provider.TEAMS: f"https://teams.microsoft.com/l/meetup-join/stub-{stub_id}",
            Meeting.Provider.IN_PERSON: "",
            Meeting.Provider.OTHER: f"https://novixa.ai/meet/stub-{stub_id}",
        }
        meeting.meeting_url = urls.get(meeting.provider, urls[Meeting.Provider.OTHER])
        meeting.save(update_fields=["meeting_url", "updated_at"])
        return self._meeting_dto(meeting)

    # Calendar connections
    def list_calendar_connections(
        self, actor_id: UUID, organization_id: UUID
    ) -> list[CalendarConnectionDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._connection_dto(c)
            for c in CalendarConnection.objects.filter(organization_id=organization_id)
        ]

    def create_calendar_connection(
        self, actor_id: UUID, organization_id: UUID, data: dict
    ) -> CalendarConnectionDTO:
        self._require_member(actor_id, organization_id)
        conn = CalendarConnection.objects.create(
            organization_id=organization_id,
            user_id=data.get("user_id") or actor_id,
            provider=data["provider"],
            status=data.get("status", CalendarConnection.Status.PENDING),
            access_token=encrypt_value(data.get("access_token", "")),
            refresh_token=encrypt_value(data.get("refresh_token", "")),
            metadata=data.get("metadata") or {},
            expires_at=data.get("expires_at"),
        )
        return self._connection_dto(conn)

    def connect_calendar(self, actor_id: UUID, organization_id: UUID, provider: str) -> dict:
        self._require_member(actor_id, organization_id)
        if provider not in {p.value for p in CalendarProvider}:
            raise InvalidCalendarProviderError()
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        client_ids = {
            "google": getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "") or "stub-google-client",
            "microsoft": getattr(settings, "MICROSOFT_CLIENT_ID", "") or "stub-ms-client",
        }
        auth_urls = {
            "google": (
                "https://accounts.google.com/o/oauth2/v2/auth"
                f"?client_id={client_ids['google']}"
                f"&redirect_uri={frontend}/calendar/callback"
                "&response_type=code&scope=calendar"
                f"&state={organization_id}:{actor_id}:google"
            ),
            "microsoft": (
                "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
                f"?client_id={client_ids['microsoft']}"
                f"&redirect_uri={frontend}/calendar/callback"
                "&response_type=code&scope=Calendars.ReadWrite"
                f"&state={organization_id}:{actor_id}:microsoft"
            ),
        }
        return {
            "provider": provider,
            "oauth_url": auth_urls[provider],
            "stub": not bool(
                getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "")
                if provider == "google"
                else getattr(settings, "MICROSOFT_CLIENT_ID", "")
            ),
        }

    def calendar_callback(self, actor_id: UUID, data: dict) -> CalendarConnectionDTO:
        organization_id = data["organization_id"]
        self._require_member(actor_id, organization_id)
        provider = data.get("provider", CalendarProvider.GOOGLE.value)
        if provider not in {p.value for p in CalendarProvider}:
            raise InvalidCalendarProviderError()
        conn = CalendarConnection.objects.create(
            organization_id=organization_id,
            user_id=actor_id,
            provider=provider,
            status=CalendarConnection.Status.ACTIVE,
            access_token=encrypt_value(data.get("code", "stub-access-token")),
            refresh_token=encrypt_value("stub-refresh-token"),
            metadata={"stub": True, "code_received": bool(data.get("code"))},
            expires_at=timezone.now() + timedelta(hours=1),
        )
        return self._connection_dto(conn)

    # Booking links
    def list_booking_links(self, actor_id: UUID, organization_id: UUID) -> list[BookingLinkDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._booking_link_dto(b)
            for b in BookingLink.objects.filter(organization_id=organization_id)
        ]

    def create_booking_link(
        self, actor_id: UUID, organization_id: UUID, data: dict
    ) -> BookingLinkDTO:
        self._require_member(actor_id, organization_id)
        slug = data.get("slug") or slugify(f"{actor_id.hex[:8]}-{uuid4().hex[:6]}")
        link = BookingLink.objects.create(
            organization_id=organization_id,
            user_id=data.get("user_id") or actor_id,
            slug=slug,
            duration_minutes=data.get("duration_minutes", 30),
            buffer_minutes=data.get("buffer_minutes", 0),
            availability=data.get("availability") or {},
            is_active=data.get("is_active", True),
        )
        return self._booking_link_dto(link)

    def get_booking_link(self, actor_id: UUID, link_id: UUID) -> BookingLinkDTO:
        link = self._get_booking_link(link_id)
        self._require_member(actor_id, link.organization_id)
        return self._booking_link_dto(link)

    def update_booking_link(self, actor_id: UUID, link_id: UUID, data: dict) -> BookingLinkDTO:
        link = self._get_booking_link(link_id)
        self._require_member(actor_id, link.organization_id)
        for key in (
            "slug",
            "duration_minutes",
            "buffer_minutes",
            "availability",
            "is_active",
        ):
            if key in data:
                setattr(link, key, data[key])
        link.save()
        return self._booking_link_dto(link)

    def delete_booking_link(self, actor_id: UUID, link_id: UUID) -> None:
        link = self._get_booking_link(link_id)
        self._require_member(actor_id, link.organization_id)
        link.delete()

    def get_public_booking_link(self, slug: str) -> BookingLinkDTO:
        try:
            link = BookingLink.objects.get(slug=slug, is_active=True)
        except BookingLink.DoesNotExist as exc:
            raise BookingLinkNotFoundError() from exc
        return self._booking_link_dto(link)

    def book_public(self, slug: str, data: dict) -> BookingDTO:
        try:
            link = BookingLink.objects.get(slug=slug, is_active=True)
        except BookingLink.DoesNotExist as exc:
            raise BookingLinkNotFoundError() from exc
        starts_at = data["starts_at"]
        ends_at = data.get("ends_at") or (starts_at + timedelta(minutes=link.duration_minutes))
        meeting = Meeting.objects.create(
            organization_id=link.organization_id,
            title=f"Booking with {data['invitee_name']}",
            description=f"Booked via /{link.slug}",
            starts_at=starts_at,
            ends_at=ends_at,
            timezone=data.get("timezone", "UTC"),
            provider=Meeting.Provider.OTHER,
            status=Meeting.Status.SCHEDULED,
            organizer_id=link.user_id,
            attendees=[{"name": data["invitee_name"], "email": data["invitee_email"]}],
        )
        booking = Booking.objects.create(
            booking_link=link,
            invitee_name=data["invitee_name"],
            invitee_email=data["invitee_email"],
            starts_at=starts_at,
            ends_at=ends_at,
            status=Booking.Status.CONFIRMED,
            meeting=meeting,
        )
        return self._booking_dto(booking)

    # Reminders
    def list_reminders(self, actor_id: UUID, meeting_id: UUID) -> list[ReminderDTO]:
        meeting = self._get_meeting(meeting_id)
        self._require_member(actor_id, meeting.organization_id)
        return [self._reminder_dto(r) for r in MeetingReminder.objects.filter(meeting=meeting)]

    def create_reminder(self, actor_id: UUID, meeting_id: UUID, data: dict) -> ReminderDTO:
        meeting = self._get_meeting(meeting_id)
        self._require_member(actor_id, meeting.organization_id)
        reminder = MeetingReminder.objects.create(
            meeting=meeting,
            remind_at=data["remind_at"],
            channel=data.get("channel", MeetingReminder.Channel.EMAIL),
        )
        return self._reminder_dto(reminder)

    def send_due_reminders(self) -> int:
        now = timezone.now()
        due = MeetingReminder.objects.filter(sent_at__isnull=True, remind_at__lte=now)
        count = 0
        for reminder in due:
            reminder.sent_at = now
            reminder.save(update_fields=["sent_at", "updated_at"])
            count += 1
        return count

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_meeting(self, meeting_id: UUID) -> Meeting:
        try:
            return Meeting.objects.get(pk=meeting_id)
        except Meeting.DoesNotExist as exc:
            raise MeetingNotFoundError() from exc

    def _get_booking_link(self, link_id: UUID) -> BookingLink:
        try:
            return BookingLink.objects.get(pk=link_id)
        except BookingLink.DoesNotExist as exc:
            raise BookingLinkNotFoundError() from exc

    def _get_connection(self, connection_id: UUID) -> CalendarConnection:
        try:
            return CalendarConnection.objects.get(pk=connection_id)
        except CalendarConnection.DoesNotExist as exc:
            raise CalendarConnectionNotFoundError() from exc

    def _get_reminder(self, reminder_id: UUID) -> MeetingReminder:
        try:
            return MeetingReminder.objects.get(pk=reminder_id)
        except MeetingReminder.DoesNotExist as exc:
            raise ReminderNotFoundError() from exc

    @staticmethod
    def _meeting_dto(m: Meeting) -> MeetingDTO:
        return MeetingDTO(
            id=m.id,
            organization_id=m.organization_id,
            title=m.title,
            description=m.description,
            starts_at=m.starts_at,
            ends_at=m.ends_at,
            timezone=m.timezone,
            location=m.location,
            meeting_url=m.meeting_url,
            provider=m.provider,
            status=m.status,
            organizer_id=m.organizer_id,
            attendees=m.attendees or [],
            created_at=m.created_at,
            updated_at=m.updated_at,
        )

    @staticmethod
    def _connection_dto(c: CalendarConnection) -> CalendarConnectionDTO:
        return CalendarConnectionDTO(
            id=c.id,
            organization_id=c.organization_id,
            user_id=c.user_id,
            provider=c.provider,
            status=c.status,
            metadata=c.metadata or {},
            expires_at=c.expires_at,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

    @staticmethod
    def _booking_link_dto(b: BookingLink) -> BookingLinkDTO:
        return BookingLinkDTO(
            id=b.id,
            organization_id=b.organization_id,
            user_id=b.user_id,
            slug=b.slug,
            duration_minutes=b.duration_minutes,
            buffer_minutes=b.buffer_minutes,
            availability=b.availability or {},
            is_active=b.is_active,
            created_at=b.created_at,
            updated_at=b.updated_at,
        )

    @staticmethod
    def _booking_dto(b: Booking) -> BookingDTO:
        return BookingDTO(
            id=b.id,
            booking_link_id=b.booking_link_id,
            invitee_name=b.invitee_name,
            invitee_email=b.invitee_email,
            starts_at=b.starts_at,
            ends_at=b.ends_at,
            status=b.status,
            meeting_id=b.meeting_id,
            created_at=b.created_at,
            updated_at=b.updated_at,
        )

    @staticmethod
    def _reminder_dto(r: MeetingReminder) -> ReminderDTO:
        return ReminderDTO(
            id=r.id,
            meeting_id=r.meeting_id,
            remind_at=r.remind_at,
            channel=r.channel,
            sent_at=r.sent_at,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )

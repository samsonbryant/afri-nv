"""Meetings serializers."""

from __future__ import annotations

from rest_framework import serializers


class MeetingWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    timezone = serializers.CharField(required=False, default="UTC")
    location = serializers.CharField(required=False, allow_blank=True, default="")
    meeting_url = serializers.URLField(required=False, allow_blank=True, default="")
    provider = serializers.ChoiceField(
        choices=["zoom", "google_meet", "teams", "in_person", "other"],
        required=False,
        default="other",
    )
    status = serializers.ChoiceField(
        choices=["scheduled", "completed", "cancelled"], required=False, default="scheduled"
    )
    organizer_id = serializers.UUIDField(required=False, allow_null=True)
    attendees = serializers.ListField(child=serializers.DictField(), required=False, default=list)


class MeetingUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    starts_at = serializers.DateTimeField(required=False)
    ends_at = serializers.DateTimeField(required=False)
    timezone = serializers.CharField(required=False)
    location = serializers.CharField(required=False, allow_blank=True)
    meeting_url = serializers.URLField(required=False, allow_blank=True)
    provider = serializers.ChoiceField(
        choices=["zoom", "google_meet", "teams", "in_person", "other"], required=False
    )
    status = serializers.ChoiceField(
        choices=["scheduled", "completed", "cancelled"], required=False
    )
    organizer_id = serializers.UUIDField(required=False, allow_null=True)
    attendees = serializers.ListField(child=serializers.DictField(), required=False)


class MeetingSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    timezone = serializers.CharField()
    location = serializers.CharField()
    meeting_url = serializers.CharField()
    provider = serializers.CharField()
    status = serializers.CharField()
    organizer_id = serializers.UUIDField(allow_null=True)
    attendees = serializers.ListField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class CalendarConnectionWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    provider = serializers.ChoiceField(choices=["google", "microsoft"])
    user_id = serializers.UUIDField(required=False)
    status = serializers.CharField(required=False, default="pending")
    access_token = serializers.CharField(required=False, allow_blank=True, default="")
    refresh_token = serializers.CharField(required=False, allow_blank=True, default="")
    metadata = serializers.DictField(required=False, default=dict)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class CalendarConnectSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()


class CalendarCallbackSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    provider = serializers.ChoiceField(
        choices=["google", "microsoft"], required=False, default="google"
    )
    code = serializers.CharField(required=False, allow_blank=True, default="")


class CalendarConnectionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    provider = serializers.CharField()
    status = serializers.CharField()
    metadata = serializers.DictField()
    expires_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class BookingLinkWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    slug = serializers.SlugField(required=False)
    user_id = serializers.UUIDField(required=False)
    duration_minutes = serializers.IntegerField(required=False, default=30, min_value=5)
    buffer_minutes = serializers.IntegerField(required=False, default=0, min_value=0)
    availability = serializers.DictField(required=False, default=dict)
    is_active = serializers.BooleanField(required=False, default=True)


class BookingLinkUpdateSerializer(serializers.Serializer):
    slug = serializers.SlugField(required=False)
    duration_minutes = serializers.IntegerField(required=False, min_value=5)
    buffer_minutes = serializers.IntegerField(required=False, min_value=0)
    availability = serializers.DictField(required=False)
    is_active = serializers.BooleanField(required=False)


class BookingLinkSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    slug = serializers.CharField()
    duration_minutes = serializers.IntegerField()
    buffer_minutes = serializers.IntegerField()
    availability = serializers.DictField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class PublicBookSerializer(serializers.Serializer):
    invitee_name = serializers.CharField(max_length=255)
    invitee_email = serializers.EmailField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField(required=False)
    timezone = serializers.CharField(required=False, default="UTC")


class BookingSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    booking_link_id = serializers.UUIDField()
    invitee_name = serializers.CharField()
    invitee_email = serializers.EmailField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    status = serializers.CharField()
    meeting_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class ReminderWriteSerializer(serializers.Serializer):
    remind_at = serializers.DateTimeField()
    channel = serializers.ChoiceField(choices=["email", "in_app"], required=False, default="email")


class ReminderSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    meeting_id = serializers.UUIDField()
    remind_at = serializers.DateTimeField()
    channel = serializers.CharField()
    sent_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

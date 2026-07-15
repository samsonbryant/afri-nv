"""Meetings admin."""

from __future__ import annotations

from django.contrib import admin

from apps.meetings.infrastructure.models import (
    Booking,
    BookingLink,
    CalendarConnection,
    Meeting,
    MeetingReminder,
)


@admin.register(CalendarConnection)
class CalendarConnectionAdmin(admin.ModelAdmin):
    list_display = ("provider", "organization", "user", "status", "expires_at")
    list_filter = ("provider", "status")
    autocomplete_fields = ("organization", "user")


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "starts_at", "provider", "status")
    list_filter = ("provider", "status")
    search_fields = ("title",)
    autocomplete_fields = ("organization", "organizer")


@admin.register(BookingLink)
class BookingLinkAdmin(admin.ModelAdmin):
    list_display = ("slug", "organization", "user", "duration_minutes", "is_active")
    search_fields = ("slug",)
    autocomplete_fields = ("organization", "user")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("invitee_email", "booking_link", "starts_at", "status")
    list_filter = ("status",)
    autocomplete_fields = ("booking_link", "meeting")


@admin.register(MeetingReminder)
class MeetingReminderAdmin(admin.ModelAdmin):
    list_display = ("meeting", "remind_at", "channel", "sent_at")
    list_filter = ("channel",)
    autocomplete_fields = ("meeting",)

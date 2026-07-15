"""Meetings API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.meetings.interfaces.api.views import (
    BookingLinkDetailView,
    BookingLinkListCreateView,
    CalendarCallbackView,
    CalendarConnectionListCreateView,
    CalendarConnectView,
    MeetingCreateLinkView,
    MeetingDetailView,
    MeetingListCreateView,
    PublicBookingView,
    ReminderListCreateView,
)

app_name = "meetings"

urlpatterns = [
    path("", MeetingListCreateView.as_view(), name="list-create"),
    path("<uuid:meeting_id>/", MeetingDetailView.as_view(), name="detail"),
    path("<uuid:meeting_id>/create-link/", MeetingCreateLinkView.as_view(), name="create-link"),
    path("<uuid:meeting_id>/reminders/", ReminderListCreateView.as_view(), name="reminders"),
    path(
        "calendar/connections/",
        CalendarConnectionListCreateView.as_view(),
        name="calendar-connections",
    ),
    path(
        "calendar/connect/<str:provider>/", CalendarConnectView.as_view(), name="calendar-connect"
    ),
    path("calendar/callback/", CalendarCallbackView.as_view(), name="calendar-callback"),
    path("booking-links/", BookingLinkListCreateView.as_view(), name="booking-links"),
    path(
        "booking-links/<uuid:link_id>/", BookingLinkDetailView.as_view(), name="booking-link-detail"
    ),
    path("booking/<slug:slug>/", PublicBookingView.as_view(), name="public-booking"),
]

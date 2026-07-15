"""Support API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.support.interfaces.api.views import (
    ChannelDetailView,
    ChannelListCreateView,
    SupportStatsView,
    TicketAiReplyView,
    TicketAssignView,
    TicketDetailView,
    TicketListCreateView,
    TicketMessagesView,
)

app_name = "support"

urlpatterns = [
    path("channels/", ChannelListCreateView.as_view(), name="channels"),
    path("channels/<uuid:channel_id>/", ChannelDetailView.as_view(), name="channel-detail"),
    path("tickets/", TicketListCreateView.as_view(), name="tickets"),
    path("tickets/<uuid:ticket_id>/", TicketDetailView.as_view(), name="ticket-detail"),
    path(
        "tickets/<uuid:ticket_id>/messages/",
        TicketMessagesView.as_view(),
        name="ticket-messages",
    ),
    path("tickets/<uuid:ticket_id>/ai-reply/", TicketAiReplyView.as_view(), name="ticket-ai-reply"),
    path("tickets/<uuid:ticket_id>/assign/", TicketAssignView.as_view(), name="ticket-assign"),
    path("stats/", SupportStatsView.as_view(), name="stats"),
]

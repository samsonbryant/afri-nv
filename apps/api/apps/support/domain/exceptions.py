"""Support domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError


class ChannelNotFoundError(NotFoundError):
    default_message = "Support channel not found."
    code = "channel_not_found"


class TicketNotFoundError(NotFoundError):
    default_message = "Ticket not found."
    code = "ticket_not_found"


class MessageNotFoundError(NotFoundError):
    default_message = "Ticket message not found."
    code = "message_not_found"

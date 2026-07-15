"""Support domain entities."""

from __future__ import annotations

from enum import StrEnum


class TicketStatus(StrEnum):
    OPEN = "open"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ChannelType(StrEnum):
    WEBSITE = "website"
    WHATSAPP = "whatsapp"
    MESSENGER = "messenger"
    TELEGRAM = "telegram"
    INSTAGRAM = "instagram"
    EMAIL = "email"
    LIVE_CHAT = "live_chat"

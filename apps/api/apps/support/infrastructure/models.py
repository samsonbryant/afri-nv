"""Support ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class SupportChannel(BaseModel):
    class Type(models.TextChoices):
        WEBSITE = "website", "Website"
        WHATSAPP = "whatsapp", "WhatsApp"
        MESSENGER = "messenger", "Messenger"
        TELEGRAM = "telegram", "Telegram"
        INSTAGRAM = "instagram", "Instagram"
        EMAIL = "email", "Email"
        LIVE_CHAT = "live_chat", "Live Chat"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="support_channels",
    )
    type = models.CharField(max_length=32, choices=Type.choices, db_index=True)
    name = models.CharField(max_length=255)
    config = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "support_channel"
        ordering = ("name",)
        indexes = [models.Index(fields=["organization", "type"])]

    def __str__(self) -> str:
        return self.name


class Ticket(BaseModel):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        PENDING = "pending", "Pending"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )
    channel = models.ForeignKey(
        SupportChannel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.OPEN, db_index=True
    )
    priority = models.CharField(
        max_length=16, choices=Priority.choices, default=Priority.MEDIUM, db_index=True
    )
    requester_email = models.EmailField(blank=True, default="")
    requester_name = models.CharField(max_length=255, blank=True, default="")
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "support_ticket"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self) -> str:
        return self.subject


class TicketMessage(BaseModel):
    class SenderType(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        AGENT = "agent", "Agent"
        AI = "ai", "AI"
        SYSTEM = "system", "System"

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="messages")
    sender_type = models.CharField(max_length=16, choices=SenderType.choices)
    body = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    is_internal = models.BooleanField(default=False)

    class Meta:
        db_table = "support_ticket_message"
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"{self.sender_type}: {self.body[:40]}"


class CannedResponse(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="canned_responses",
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    shortcut = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        db_table = "support_canned_response"
        ordering = ("title",)

    def __str__(self) -> str:
        return self.title

"""Assistant ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class Conversation(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    title = models.CharField(max_length=255, blank=True, default="New conversation")

    class Meta:
        db_table = "assistant_conversation"
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["organization", "user"]),
        ]

    def __str__(self) -> str:
        return self.title


class Message(BaseModel):
    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"
        SYSTEM = "system", "System"

    class ContentType(models.TextChoices):
        TEXT = "text", "Text"
        MARKDOWN = "markdown", "Markdown"
        CODE = "code", "Code"
        IMAGE = "image", "Image"

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=16, choices=Role.choices)
    content = models.TextField()
    content_type = models.CharField(
        max_length=16,
        choices=ContentType.choices,
        default=ContentType.MARKDOWN,
    )
    attachments = models.JSONField(default=list, blank=True)
    citations = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "assistant_message"
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"{self.role}: {self.content[:40]}"

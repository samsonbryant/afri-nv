"""Assistant domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class ConversationNotFoundError(NotFoundError):
    default_message = "Conversation not found."
    code = "conversation_not_found"


class EmptyMessageError(ValidationError):
    default_message = "Message content cannot be empty."
    code = "empty_message"

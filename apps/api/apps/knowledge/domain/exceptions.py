"""Knowledge domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class KnowledgeDocumentNotFoundError(NotFoundError):
    default_message = "Knowledge document not found."
    code = "knowledge_document_not_found"


class KnowledgeConversationNotFoundError(NotFoundError):
    default_message = "Knowledge conversation not found."
    code = "knowledge_conversation_not_found"


class EmptyKnowledgeMessageError(ValidationError):
    default_message = "Message content cannot be empty."
    code = "empty_knowledge_message"

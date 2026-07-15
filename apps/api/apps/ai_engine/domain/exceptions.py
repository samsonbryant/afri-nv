"""AI engine domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class DocumentNotFoundError(NotFoundError):
    default_message = "Document not found."
    code = "document_not_found"


class EmptyContentError(ValidationError):
    default_message = "Document content cannot be empty."
    code = "empty_content"

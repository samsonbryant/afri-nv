"""Shared domain exceptions."""

from __future__ import annotations


class DomainError(Exception):
    """Base class for domain-layer errors."""

    default_message = "A domain error occurred."
    code = "domain_error"

    def __init__(self, message: str | None = None, *, code: str | None = None) -> None:
        self.message = message or self.default_message
        self.code = code or self.code
        super().__init__(self.message)


class NotFoundError(DomainError):
    default_message = "Resource not found."
    code = "not_found"


class PermissionDeniedError(DomainError):
    default_message = "Permission denied."
    code = "permission_denied"


class ValidationError(DomainError):
    default_message = "Validation failed."
    code = "validation_error"


class ConflictError(DomainError):
    default_message = "Resource conflict."
    code = "conflict"


class AuthenticationError(DomainError):
    default_message = "Authentication failed."
    code = "authentication_error"

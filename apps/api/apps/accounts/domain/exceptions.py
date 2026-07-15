"""Accounts domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import ConflictError, DomainError, NotFoundError


class UserNotFoundError(NotFoundError):
    default_message = "User not found."
    code = "user_not_found"


class EmailAlreadyExistsError(ConflictError):
    default_message = "A user with this email already exists."
    code = "email_already_exists"


class InvalidCredentialsError(DomainError):
    default_message = "Invalid email or password."
    code = "invalid_credentials"

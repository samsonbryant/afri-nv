"""Dashboard domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class NotificationNotFoundError(NotFoundError):
    default_message = "Notification not found."
    code = "notification_not_found"


class OrganizationRequiredError(ValidationError):
    default_message = "organization_id is required."
    code = "organization_required"

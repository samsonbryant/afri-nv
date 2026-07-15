"""Security domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import PermissionDeniedError


class SecurityAccessDeniedError(PermissionDeniedError):
    default_message = "Security action requires owner or admin."
    code = "security_access_denied"

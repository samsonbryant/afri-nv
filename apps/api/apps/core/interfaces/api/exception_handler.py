"""Custom DRF exception handler mapping domain errors to HTTP responses."""

from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from apps.core.domain.exceptions import (
    AuthenticationError,
    ConflictError,
    DomainError,
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)

_STATUS_MAP: dict[type[DomainError], int] = {
    NotFoundError: status.HTTP_404_NOT_FOUND,
    PermissionDeniedError: status.HTTP_403_FORBIDDEN,
    ValidationError: status.HTTP_400_BAD_REQUEST,
    ConflictError: status.HTTP_409_CONFLICT,
    AuthenticationError: status.HTTP_401_UNAUTHORIZED,
}


def _status_for_domain_error(exc: DomainError) -> int:
    """Walk the MRO so subclasses (e.g. NotOrganizationMemberError) map correctly."""
    for cls in type(exc).mro():
        if cls in _STATUS_MAP:
            return _STATUS_MAP[cls]
    return status.HTTP_400_BAD_REQUEST


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, DomainError):
        return Response(
            {
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                }
            },
            status=_status_for_domain_error(exc),
        )

    response = drf_exception_handler(exc, context)
    if response is not None:
        response.data = {
            "error": {
                "code": "api_error",
                "message": response.data,
            }
        }
    return response

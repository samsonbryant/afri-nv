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


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, DomainError):
        http_status = _STATUS_MAP.get(type(exc), status.HTTP_400_BAD_REQUEST)
        return Response(
            {
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                }
            },
            status=http_status,
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

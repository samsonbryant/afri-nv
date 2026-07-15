"""Core API views."""

from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.infrastructure.dependencies import get_health_service
from apps.core.interfaces.serializers.serializers import HealthCheckSerializer


class HealthCheckView(APIView):
    """GET /api/v1/health/ — public liveness/readiness probe."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    def get(self, request: Request) -> Response:
        service = get_health_service()
        result = service.check()
        serializer = HealthCheckSerializer(
            {
                "status": result.status,
                "version": result.version,
                "timestamp": result.timestamp,
                "checks": result.checks,
            }
        )
        http_status = (
            status.HTTP_200_OK if result.status == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(serializer.data, status=http_status)

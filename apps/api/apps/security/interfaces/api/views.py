"""Security API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.security.infrastructure.dependencies import get_security_service


def _org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["security"])
    def get(self, request: Request) -> Response:
        return Response(get_security_service().list_audit_logs(request.user.id, _org(request)))


class BackupTriggerView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["security"])
    def post(self, request: Request) -> Response:
        return Response(
            get_security_service().trigger_backup(request.user.id),
            status=status.HTTP_202_ACCEPTED,
        )


class SecurityStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["security"])
    def get(self, request: Request) -> Response:
        return Response(get_security_service().status())

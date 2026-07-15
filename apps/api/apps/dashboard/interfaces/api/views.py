"""Dashboard API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.dashboard.domain.exceptions import OrganizationRequiredError
from apps.dashboard.infrastructure.dependencies import get_dashboard_service
from apps.dashboard.interfaces.serializers.serializers import (
    ActivitySerializer,
    NotificationSerializer,
    OverviewSerializer,
    UsagePointSerializer,
)


class OverviewView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["dashboard"])
    def get(self, request: Request) -> Response:
        org_id = request.query_params.get("organization_id")
        if not org_id:
            raise OrganizationRequiredError()
        service = get_dashboard_service()
        result = service.overview(request.user.id, UUID(org_id))
        return Response(OverviewSerializer(result.kpis).data)


class ActivityView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["dashboard"])
    def get(self, request: Request) -> Response:
        org_id = request.query_params.get("organization_id")
        if not org_id:
            raise OrganizationRequiredError()
        service = get_dashboard_service()
        result = service.activity(request.user.id, UUID(org_id))
        return Response(ActivitySerializer(result.items, many=True).data)


class UsageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["dashboard"])
    def get(self, request: Request) -> Response:
        org_id = request.query_params.get("organization_id")
        if not org_id:
            raise OrganizationRequiredError()
        days = int(request.query_params.get("days", "7"))
        service = get_dashboard_service()
        result = service.usage(request.user.id, UUID(org_id), days=days)
        return Response(
            {
                "days": result.days,
                "points": UsagePointSerializer(result.points, many=True).data,
            }
        )


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["notifications"])
    def get(self, request: Request) -> Response:
        service = get_dashboard_service()
        items = service.list_notifications(request.user.id)
        return Response(NotificationSerializer(items, many=True).data)


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["notifications"])
    def post(self, request: Request, notification_id: UUID) -> Response:
        service = get_dashboard_service()
        item = service.mark_read(request.user.id, notification_id)
        return Response(NotificationSerializer(item).data)


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["notifications"])
    def post(self, request: Request) -> Response:
        service = get_dashboard_service()
        count = service.mark_all_read(request.user.id)
        return Response({"detail": "All notifications marked read.", "count": count})

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.infrastructure.dependencies import get_analytics_service
from apps.core.domain.exceptions import ValidationError


def _require_org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class OverviewView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(get_analytics_service().overview(request.user.id, _require_org(request)))


class RevenueView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(
            get_analytics_service().revenue_series(request.user.id, _require_org(request))
        )


class MrrView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(get_analytics_service().mrr(request.user.id, _require_org(request)))


class ArrView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(get_analytics_service().arr(request.user.id, _require_org(request)))


class RetentionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(get_analytics_service().retention(request.user.id, _require_org(request)))


class ChurnView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(get_analytics_service().churn(request.user.id, _require_org(request)))


class AiUsageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(get_analytics_service().ai_usage(request.user.id, _require_org(request)))


class PerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(get_analytics_service().performance(request.user.id, _require_org(request)))


class SatisfactionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"])
    def get(self, request: Request) -> Response:
        return Response(
            get_analytics_service().satisfaction(request.user.id, _require_org(request))
        )

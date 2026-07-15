"""Reports API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.reports.infrastructure.dependencies import get_report_service
from apps.reports.interfaces.serializers.serializers import (
    GenerateReportSerializer,
    ReportSerializer,
    ReportWriteSerializer,
)


def _org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class ReportListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["reports"])
    def get(self, request: Request) -> Response:
        items = get_report_service().list_reports(request.user.id, _org(request))
        return Response(ReportSerializer(items, many=True).data)

    @extend_schema(request=ReportWriteSerializer, tags=["reports"])
    def post(self, request: Request) -> Response:
        serializer = ReportWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = get_report_service().create_report(
            request.user.id,
            data["organization_id"],
            report_type=data["type"],
            title=data.get("title") or "",
            period_start=data.get("period_start"),
            period_end=data.get("period_end"),
        )
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)


class ReportDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["reports"])
    def get(self, request: Request, report_id: UUID) -> Response:
        report = get_report_service().get_report(request.user.id, report_id)
        return Response(ReportSerializer(report).data)


class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=GenerateReportSerializer, tags=["reports"])
    def post(self, request: Request) -> Response:
        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = get_report_service().generate(
            request.user.id,
            data["organization_id"],
            report_type=data["type"],
            title=data.get("title") or "",
            period_start=data.get("period_start"),
            period_end=data.get("period_end"),
        )
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)


class ReportTemplatesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["reports"])
    def get(self, request: Request) -> Response:
        return Response(get_report_service().templates())

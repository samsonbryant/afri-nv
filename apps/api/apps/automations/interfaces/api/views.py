"""Automation API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.automations.application.dto import TriggerAutomationDTO
from apps.automations.infrastructure.dependencies import get_automation_service
from apps.automations.interfaces.serializers.serializers import (
    AutomationRunSerializer,
    TriggerAutomationSerializer,
)


class AutomationRunListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="organization_id",
                type=UUID,
                location=OpenApiParameter.QUERY,
                required=True,
            ),
            OpenApiParameter(
                name="workflow_id",
                type=UUID,
                location=OpenApiParameter.QUERY,
                required=False,
            ),
        ],
        responses={200: AutomationRunSerializer(many=True)},
        tags=["automations"],
    )
    def get(self, request: Request) -> Response:
        organization_id = request.query_params.get("organization_id")
        if not organization_id:
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "organization_id query param is required",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        workflow_id_raw = request.query_params.get("workflow_id")
        workflow_id = UUID(str(workflow_id_raw)) if workflow_id_raw else None
        service = get_automation_service()
        runs = service.list_runs(
            request.user.id,
            UUID(str(organization_id)),
            workflow_id=workflow_id,
        )
        return Response(AutomationRunSerializer(runs, many=True).data)


class AutomationTriggerView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=TriggerAutomationSerializer,
        responses={201: AutomationRunSerializer},
        tags=["automations"],
    )
    def post(self, request: Request) -> Response:
        serializer = TriggerAutomationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_automation_service()
        run = service.trigger(
            request.user.id,
            TriggerAutomationDTO(
                workflow_id=data["workflow_id"],
                input_payload=data.get("input_payload", {}),
            ),
        )
        return Response(AutomationRunSerializer(run).data, status=status.HTTP_201_CREATED)


class AutomationRunDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: AutomationRunSerializer}, tags=["automations"])
    def get(self, request: Request, run_id: UUID) -> Response:
        service = get_automation_service()
        run = service.get_run(request.user.id, run_id)
        return Response(AutomationRunSerializer(run).data)

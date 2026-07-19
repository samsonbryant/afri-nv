"""Workflow API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.automations.infrastructure.dependencies import get_automation_service
from apps.workflows.application.dto import CreateWorkflowDTO, UpdateWorkflowDTO
from apps.workflows.domain.node_types import list_node_types
from apps.workflows.infrastructure.dependencies import get_workflow_service
from apps.workflows.interfaces.serializers.serializers import (
    WorkflowSerializer,
    WorkflowUpdateSerializer,
    WorkflowWriteSerializer,
)


class WorkflowListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="organization_id",
                type=UUID,
                location=OpenApiParameter.QUERY,
                required=True,
            )
        ],
        responses={200: WorkflowSerializer(many=True)},
        tags=["workflows"],
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
        service = get_workflow_service()
        workflows = service.list_for_organization(request.user.id, UUID(str(organization_id)))
        return Response(WorkflowSerializer(workflows, many=True).data)

    @extend_schema(
        request=WorkflowWriteSerializer,
        responses={201: WorkflowSerializer},
        tags=["workflows"],
    )
    def post(self, request: Request) -> Response:
        serializer = WorkflowWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_workflow_service()
        workflow = service.create(
            request.user.id,
            CreateWorkflowDTO(
                organization_id=data["organization_id"],
                name=data["name"],
                description=data.get("description", ""),
                definition=data.get("definition", {}),
                status=data.get("status", "draft"),
            ),
        )
        return Response(WorkflowSerializer(workflow).data, status=status.HTTP_201_CREATED)


class WorkflowDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: WorkflowSerializer}, tags=["workflows"])
    def get(self, request: Request, workflow_id: UUID) -> Response:
        service = get_workflow_service()
        workflow = service.get(request.user.id, workflow_id)
        return Response(WorkflowSerializer(workflow).data)

    @extend_schema(
        request=WorkflowUpdateSerializer,
        responses={200: WorkflowSerializer},
        tags=["workflows"],
    )
    def patch(self, request: Request, workflow_id: UUID) -> Response:
        serializer = WorkflowUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = get_workflow_service()
        workflow = service.update(
            request.user.id,
            workflow_id,
            UpdateWorkflowDTO(**serializer.validated_data),
        )
        return Response(WorkflowSerializer(workflow).data)

    @extend_schema(responses={204: None}, tags=["workflows"])
    def delete(self, request: Request, workflow_id: UUID) -> Response:
        service = get_workflow_service()
        service.delete(request.user.id, workflow_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkflowNodeTypesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["workflows"])
    def get(self, request: Request) -> Response:
        return Response(list_node_types())


class WorkflowValidateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["workflows"])
    def post(self, request: Request, workflow_id: UUID) -> Response:
        definition = request.data.get("definition") if isinstance(request.data, dict) else None
        result = get_workflow_service().validate_definition(
            request.user.id,
            workflow_id,
            definition if isinstance(definition, dict) else None,
        )
        return Response(result)


class WorkflowPublishView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["workflows"])
    def post(self, request: Request, workflow_id: UUID) -> Response:
        workflow = get_workflow_service().publish(request.user.id, workflow_id)
        return Response(
            {
                "id": str(workflow.id),
                "status": workflow.status,
                "message": "Published",
            }
        )


class WorkflowRunView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["workflows"])
    def post(self, request: Request, workflow_id: UUID) -> Response:
        payload = request.data.get("input") if isinstance(request.data, dict) else None
        if payload is not None and not isinstance(payload, dict):
            payload = {"value": payload}
        result = get_workflow_service().run(
            request.user.id,
            workflow_id,
            payload if isinstance(payload, dict) else None,
        )
        return Response(result, status=status.HTTP_201_CREATED)


class WorkflowRunsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["workflows"])
    def get(self, request: Request, workflow_id: UUID) -> Response:
        workflow = get_workflow_service().get(request.user.id, workflow_id)
        runs = get_automation_service().list_runs(
            request.user.id,
            workflow.organization_id,
            workflow_id=workflow_id,
        )
        return Response(
            [
                {
                    "id": str(r.id),
                    "workflow_id": str(r.workflow_id),
                    "status": r.status,
                    "input_payload": r.input_payload,
                    "output_payload": r.output_payload,
                    "error_message": r.error_message,
                    "created_at": r.created_at,
                    "finished_at": r.finished_at,
                }
                for r in runs
            ]
        )

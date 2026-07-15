"""Workflow API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.workflows.application.dto import CreateWorkflowDTO, UpdateWorkflowDTO
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

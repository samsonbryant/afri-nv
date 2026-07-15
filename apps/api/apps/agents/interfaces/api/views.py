from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.agents.infrastructure.dependencies import get_agent_service
from apps.agents.interfaces.serializers.serializers import (
    AgentRunSerializer,
    AgentRunWriteSerializer,
    AgentSerializer,
    AgentUpdateSerializer,
    AgentWriteSerializer,
)
from apps.core.domain.exceptions import ValidationError


def _require_org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class AgentCatalogView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["agents"])
    def get(self, request: Request) -> Response:
        return Response(get_agent_service().catalog())


class AgentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["agents"])
    def get(self, request: Request) -> Response:
        agent_type = request.query_params.get("type")
        items = get_agent_service().list_agents(request.user.id, _require_org(request), agent_type)
        return Response(AgentSerializer(items, many=True).data)

    @extend_schema(request=AgentWriteSerializer, tags=["agents"])
    def post(self, request: Request) -> Response:
        serializer = AgentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        org_id = data.pop("organization_id")
        item = get_agent_service().create_agent(request.user.id, org_id, data)
        return Response(AgentSerializer(item).data, status=status.HTTP_201_CREATED)


class AgentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["agents"])
    def get(self, request: Request, agent_id: UUID) -> Response:
        return Response(
            AgentSerializer(get_agent_service().get_agent(request.user.id, agent_id)).data
        )

    @extend_schema(request=AgentUpdateSerializer, tags=["agents"])
    def patch(self, request: Request, agent_id: UUID) -> Response:
        serializer = AgentUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_agent_service().update_agent(
            request.user.id, agent_id, serializer.validated_data
        )
        return Response(AgentSerializer(item).data)


class AgentRunView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AgentRunWriteSerializer, tags=["agents"])
    def post(self, request: Request, agent_id: UUID) -> Response:
        serializer = AgentRunWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        run = get_agent_service().run_agent(
            request.user.id,
            agent_id,
            serializer.validated_data["message"],
            serializer.validated_data.get("context") or {},
        )
        return Response(AgentRunSerializer(run).data, status=status.HTTP_201_CREATED)


class AgentRunsListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["agents"])
    def get(self, request: Request, agent_id: UUID) -> Response:
        runs = get_agent_service().list_runs(request.user.id, agent_id)
        return Response(AgentRunSerializer(runs, many=True).data)

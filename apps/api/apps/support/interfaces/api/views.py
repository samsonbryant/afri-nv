"""Support API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.support.infrastructure.dependencies import get_support_service
from apps.support.interfaces.serializers.serializers import (
    AiReplySerializer,
    AssignSerializer,
    ChannelSerializer,
    ChannelUpdateSerializer,
    ChannelWriteSerializer,
    StatsSerializer,
    TicketMessageSerializer,
    TicketMessageWriteSerializer,
    TicketSerializer,
    TicketUpdateSerializer,
    TicketWriteSerializer,
)


def _org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class ChannelListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["support"])
    def get(self, request: Request) -> Response:
        items = get_support_service().list_channels(request.user.id, _org(request))
        return Response(ChannelSerializer(items, many=True).data)

    @extend_schema(request=ChannelWriteSerializer, tags=["support"])
    def post(self, request: Request) -> Response:
        serializer = ChannelWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_support_service().create_channel(request.user.id, org_id, data)
        return Response(ChannelSerializer(item).data, status=status.HTTP_201_CREATED)


class ChannelDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["support"])
    def get(self, request: Request, channel_id: UUID) -> Response:
        return Response(
            ChannelSerializer(get_support_service().get_channel(request.user.id, channel_id)).data
        )

    @extend_schema(request=ChannelUpdateSerializer, tags=["support"])
    def patch(self, request: Request, channel_id: UUID) -> Response:
        serializer = ChannelUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_support_service().update_channel(
            request.user.id, channel_id, serializer.validated_data
        )
        return Response(ChannelSerializer(item).data)

    @extend_schema(tags=["support"])
    def delete(self, request: Request, channel_id: UUID) -> Response:
        get_support_service().delete_channel(request.user.id, channel_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["support"])
    def get(self, request: Request) -> Response:
        items = get_support_service().list_tickets(request.user.id, _org(request))
        return Response(TicketSerializer(items, many=True).data)

    @extend_schema(request=TicketWriteSerializer, tags=["support"])
    def post(self, request: Request) -> Response:
        serializer = TicketWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_support_service().create_ticket(request.user.id, org_id, data)
        return Response(TicketSerializer(item).data, status=status.HTTP_201_CREATED)


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["support"])
    def get(self, request: Request, ticket_id: UUID) -> Response:
        return Response(
            TicketSerializer(get_support_service().get_ticket(request.user.id, ticket_id)).data
        )

    @extend_schema(request=TicketUpdateSerializer, tags=["support"])
    def patch(self, request: Request, ticket_id: UUID) -> Response:
        serializer = TicketUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_support_service().update_ticket(
            request.user.id, ticket_id, serializer.validated_data
        )
        return Response(TicketSerializer(item).data)

    @extend_schema(tags=["support"])
    def delete(self, request: Request, ticket_id: UUID) -> Response:
        get_support_service().delete_ticket(request.user.id, ticket_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TicketMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["support"])
    def get(self, request: Request, ticket_id: UUID) -> Response:
        items = get_support_service().list_messages(request.user.id, ticket_id)
        return Response(TicketMessageSerializer(items, many=True).data)

    @extend_schema(request=TicketMessageWriteSerializer, tags=["support"])
    def post(self, request: Request, ticket_id: UUID) -> Response:
        serializer = TicketMessageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = get_support_service().add_message(
            request.user.id, ticket_id, serializer.validated_data
        )
        return Response(TicketMessageSerializer(item).data, status=status.HTTP_201_CREATED)


class TicketAiReplyView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AiReplySerializer, tags=["support"])
    def post(self, request: Request, ticket_id: UUID) -> Response:
        serializer = AiReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = get_support_service().ai_reply(
            request.user.id,
            ticket_id,
            post=serializer.validated_data.get("post", True),
        )
        return Response(
            {
                "draft": result["draft"],
                "message": TicketMessageSerializer(result["message"]).data
                if result["message"]
                else None,
            },
            status=status.HTTP_201_CREATED,
        )


class TicketAssignView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=AssignSerializer, tags=["support"])
    def post(self, request: Request, ticket_id: UUID) -> Response:
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = get_support_service().assign_ticket(
            request.user.id, ticket_id, serializer.validated_data.get("assignee_id")
        )
        return Response(TicketSerializer(item).data)


class SupportStatsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["support"])
    def get(self, request: Request) -> Response:
        stats = get_support_service().stats(request.user.id, _org(request))
        return Response(StatsSerializer(stats).data)

"""Assistant API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assistant.application.dto import (
    CreateConversationDTO,
    SendMessageDTO,
    UpdateConversationDTO,
)
from apps.assistant.domain.exceptions import EmptyMessageError
from apps.assistant.infrastructure.dependencies import get_assistant_service
from apps.assistant.interfaces.serializers.serializers import (
    ConversationSerializer,
    CreateConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
    UpdateConversationSerializer,
    UploadResultSerializer,
)
from apps.core.domain.exceptions import ValidationError


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["assistant"])
    def get(self, request: Request) -> Response:
        org_id = request.query_params.get("organization_id")
        if not org_id:
            raise ValidationError("organization_id is required.")
        service = get_assistant_service()
        items = service.list_conversations(request.user.id, UUID(org_id))
        return Response(ConversationSerializer(items, many=True).data)

    @extend_schema(request=CreateConversationSerializer, tags=["assistant"])
    def post(self, request: Request) -> Response:
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_assistant_service()
        conversation = service.create_conversation(
            request.user.id,
            CreateConversationDTO(
                organization_id=data["organization_id"],
                title=data.get("title") or "New conversation",
            ),
        )
        return Response(
            ConversationSerializer(conversation).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["assistant"])
    def get(self, request: Request, conversation_id: UUID) -> Response:
        service = get_assistant_service()
        conversation = service.get_conversation(request.user.id, conversation_id)
        return Response(ConversationSerializer(conversation).data)

    @extend_schema(request=UpdateConversationSerializer, tags=["assistant"])
    def patch(self, request: Request, conversation_id: UUID) -> Response:
        serializer = UpdateConversationSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = get_assistant_service()
        conversation = service.update_conversation(
            request.user.id,
            conversation_id,
            UpdateConversationDTO(**serializer.validated_data),
        )
        return Response(ConversationSerializer(conversation).data)

    @extend_schema(tags=["assistant"])
    def delete(self, request: Request, conversation_id: UUID) -> Response:
        service = get_assistant_service()
        service.delete_conversation(request.user.id, conversation_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["assistant"])
    def get(self, request: Request, conversation_id: UUID) -> Response:
        service = get_assistant_service()
        messages = service.list_messages(request.user.id, conversation_id)
        return Response(MessageSerializer(messages, many=True).data)

    @extend_schema(request=SendMessageSerializer, tags=["assistant"])
    def post(self, request: Request, conversation_id: UUID) -> Response:
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_assistant_service()
        result = service.send_message(
            request.user.id,
            conversation_id,
            SendMessageDTO(
                content=data["content"],
                content_type=data.get("content_type", "markdown"),
                attachments=data.get("attachments") or [],
            ),
        )
        return Response(
            {
                "user_message": MessageSerializer(result.user_message).data,
                "assistant_message": MessageSerializer(result.assistant_message).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MessageStreamView(APIView):
    """Non-streaming fallback — returns the full reply like POST messages/."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=SendMessageSerializer, tags=["assistant"])
    def post(self, request: Request, conversation_id: UUID) -> Response:
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_assistant_service()
        result = service.send_message(
            request.user.id,
            conversation_id,
            SendMessageDTO(
                content=data["content"],
                content_type=data.get("content_type", "markdown"),
                attachments=data.get("attachments") or [],
            ),
        )
        return Response(
            {
                "user_message": MessageSerializer(result.user_message).data,
                "assistant_message": MessageSerializer(result.assistant_message).data,
                "streamed": False,
            },
            status=status.HTTP_201_CREATED,
        )


class UploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(tags=["assistant"])
    def post(self, request: Request) -> Response:
        uploaded = request.FILES.get("file")
        if uploaded is None:
            raise EmptyMessageError("file is required.")
        service = get_assistant_service()
        result = service.upload(request.user.id, uploaded)
        return Response(UploadResultSerializer(result).data, status=status.HTTP_201_CREATED)

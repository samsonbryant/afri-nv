"""Knowledge API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.knowledge.application.dto import CreateConversationDTO, SendKnowledgeMessageDTO
from apps.knowledge.infrastructure.dependencies import get_knowledge_service
from apps.knowledge.interfaces.serializers.serializers import (
    ChunkSerializer,
    ConversationSerializer,
    ConversationWriteSerializer,
    DocumentSerializer,
    DocumentUploadSerializer,
    MessageSerializer,
    SendMessageSerializer,
)


class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="organization_id",
                type=UUID,
                location=OpenApiParameter.QUERY,
                required=True,
            )
        ],
        tags=["knowledge"],
    )
    def get(self, request: Request) -> Response:
        org_id = request.query_params.get("organization_id")
        if not org_id:
            raise ValidationError("organization_id is required.")
        items = get_knowledge_service().list_documents(request.user.id, UUID(org_id))
        return Response(DocumentSerializer(items, many=True).data)

    @extend_schema(request=DocumentUploadSerializer, tags=["knowledge"])
    def post(self, request: Request) -> Response:
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        doc = get_knowledge_service().upload_document(
            request.user.id,
            data["organization_id"],
            title=data.get("title") or "",
            uploaded=data.get("file"),
        )
        return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["knowledge"])
    def get(self, request: Request, document_id: UUID) -> Response:
        doc = get_knowledge_service().get_document(request.user.id, document_id)
        return Response(DocumentSerializer(doc).data)

    @extend_schema(tags=["knowledge"])
    def delete(self, request: Request, document_id: UUID) -> Response:
        get_knowledge_service().delete_document(request.user.id, document_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentReprocessView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["knowledge"])
    def post(self, request: Request, document_id: UUID) -> Response:
        doc = get_knowledge_service().reprocess_document(request.user.id, document_id)
        return Response(DocumentSerializer(doc).data)


class DocumentChunksView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["knowledge"])
    def get(self, request: Request, document_id: UUID) -> Response:
        chunks = get_knowledge_service().list_chunks(request.user.id, document_id)
        return Response(ChunkSerializer(chunks, many=True).data)


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["knowledge"])
    def get(self, request: Request) -> Response:
        org_id = request.query_params.get("organization_id")
        if not org_id:
            raise ValidationError("organization_id is required.")
        items = get_knowledge_service().list_conversations(request.user.id, UUID(org_id))
        return Response(ConversationSerializer(items, many=True).data)

    @extend_schema(request=ConversationWriteSerializer, tags=["knowledge"])
    def post(self, request: Request) -> Response:
        serializer = ConversationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        conversation = get_knowledge_service().create_conversation(
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


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["knowledge"])
    def get(self, request: Request, conversation_id: UUID) -> Response:
        messages = get_knowledge_service().list_messages(request.user.id, conversation_id)
        return Response(MessageSerializer(messages, many=True).data)

    @extend_schema(request=SendMessageSerializer, tags=["knowledge"])
    def post(self, request: Request, conversation_id: UUID) -> Response:
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = get_knowledge_service().send_message(
            request.user.id,
            conversation_id,
            SendKnowledgeMessageDTO(content=serializer.validated_data["content"]),
        )
        return Response(
            {
                "user_message": MessageSerializer(result.user_message).data,
                "assistant_message": MessageSerializer(result.assistant_message).data,
                "citations": result.citations,
            },
            status=status.HTTP_201_CREATED,
        )

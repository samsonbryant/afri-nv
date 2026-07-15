"""AI engine API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_engine.application.dto import CreateDocumentDTO, SearchDocumentsDTO
from apps.ai_engine.infrastructure.dependencies import get_document_service
from apps.ai_engine.interfaces.serializers.serializers import (
    DocumentSerializer,
    DocumentWriteSerializer,
    SearchHitSerializer,
    SearchQuerySerializer,
)


class DocumentListCreateView(APIView):
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
        responses={200: DocumentSerializer(many=True)},
        tags=["ai"],
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
        service = get_document_service()
        documents = service.list_for_organization(request.user.id, UUID(str(organization_id)))
        return Response(DocumentSerializer(documents, many=True).data)

    @extend_schema(
        request=DocumentWriteSerializer,
        responses={201: DocumentSerializer},
        tags=["ai"],
    )
    def post(self, request: Request) -> Response:
        serializer = DocumentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_document_service()
        document = service.create(
            request.user.id,
            CreateDocumentDTO(
                organization_id=data["organization_id"],
                title=data["title"],
                content=data["content"],
                source=data.get("source", "manual"),
                metadata=data.get("metadata", {}),
            ),
        )
        return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: DocumentSerializer}, tags=["ai"])
    def get(self, request: Request, document_id: UUID) -> Response:
        service = get_document_service()
        document = service.get(request.user.id, document_id)
        return Response(DocumentSerializer(document).data)

    @extend_schema(responses={204: None}, tags=["ai"])
    def delete(self, request: Request, document_id: UUID) -> Response:
        service = get_document_service()
        service.delete(request.user.id, document_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentSearchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=SearchQuerySerializer,
        responses={200: SearchHitSerializer(many=True)},
        tags=["ai"],
    )
    def post(self, request: Request) -> Response:
        serializer = SearchQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_document_service()
        hits = service.search(
            request.user.id,
            SearchDocumentsDTO(
                organization_id=data["organization_id"],
                query=data["query"],
                limit=data.get("limit", 5),
            ),
        )
        return Response(SearchHitSerializer(hits, many=True).data)

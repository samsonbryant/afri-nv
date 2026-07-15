"""Documents Studio API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.documents.infrastructure.dependencies import get_document_studio_service
from apps.documents.interfaces.serializers.serializers import (
    DocumentJobSerializer,
    DocumentUploadSerializer,
    JobCreateSerializer,
    StudioDocumentSerializer,
)


def _org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(tags=["documents"])
    def get(self, request: Request) -> Response:
        items = get_document_studio_service().list_documents(request.user.id, _org(request))
        return Response(StudioDocumentSerializer(items, many=True).data)

    @extend_schema(request=DocumentUploadSerializer, tags=["documents"])
    def post(self, request: Request) -> Response:
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        doc = get_document_studio_service().upload_document(
            request.user.id,
            data["organization_id"],
            title=data.get("title") or "",
            uploaded=data.get("file"),
        )
        return Response(StudioDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["documents"])
    def get(self, request: Request, document_id: UUID) -> Response:
        doc = get_document_studio_service().get_document(request.user.id, document_id)
        return Response(StudioDocumentSerializer(doc).data)

    @extend_schema(tags=["documents"])
    def delete(self, request: Request, document_id: UUID) -> Response:
        get_document_studio_service().delete_document(request.user.id, document_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentJobsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=JobCreateSerializer, tags=["documents"])
    def post(self, request: Request, document_id: UUID) -> Response:
        serializer = JobCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        job = get_document_studio_service().create_job(
            request.user.id,
            document_id,
            job_type=data["job_type"],
            params=data.get("params") or {},
        )
        return Response(DocumentJobSerializer(job).data, status=status.HTTP_201_CREATED)


class JobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["documents"])
    def get(self, request: Request, job_id: UUID) -> Response:
        job = get_document_studio_service().get_job(request.user.id, job_id)
        return Response(DocumentJobSerializer(job).data)

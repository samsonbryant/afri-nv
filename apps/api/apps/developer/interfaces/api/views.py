"""Developer API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.developer.infrastructure.dependencies import get_developer_service
from apps.developer.interfaces.serializers.serializers import (
    ApiKeyWriteSerializer,
    WebhookUpdateSerializer,
    WebhookWriteSerializer,
)


def _org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class WebhookListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["webhooks"])
    def get(self, request: Request) -> Response:
        return Response(get_developer_service().list_webhooks(request.user.id, _org(request)))

    @extend_schema(request=WebhookWriteSerializer, tags=["webhooks"])
    def post(self, request: Request) -> Response:
        serializer = WebhookWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_developer_service().create_webhook(request.user.id, org_id, data)
        return Response(item, status=status.HTTP_201_CREATED)


class WebhookDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["webhooks"])
    def get(self, request: Request, endpoint_id: UUID) -> Response:
        return Response(get_developer_service().get_webhook(request.user.id, endpoint_id))

    @extend_schema(request=WebhookUpdateSerializer, tags=["webhooks"])
    def patch(self, request: Request, endpoint_id: UUID) -> Response:
        serializer = WebhookUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(
            get_developer_service().update_webhook(
                request.user.id, endpoint_id, serializer.validated_data
            )
        )

    @extend_schema(tags=["webhooks"])
    def delete(self, request: Request, endpoint_id: UUID) -> Response:
        get_developer_service().delete_webhook(request.user.id, endpoint_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApiKeyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["api-keys"])
    def get(self, request: Request) -> Response:
        return Response(get_developer_service().list_api_keys(request.user.id, _org(request)))

    @extend_schema(request=ApiKeyWriteSerializer, tags=["api-keys"])
    def post(self, request: Request) -> Response:
        serializer = ApiKeyWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_developer_service().create_api_key(request.user.id, org_id, data)
        return Response(item, status=status.HTTP_201_CREATED)


class ApiKeyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["api-keys"])
    def delete(self, request: Request, key_id: UUID) -> Response:
        get_developer_service().delete_api_key(request.user.id, key_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

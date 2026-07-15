"""Marketing API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.marketing.infrastructure.dependencies import get_marketing_service
from apps.marketing.interfaces.serializers.serializers import (
    AssetSerializer,
    AssetUpdateSerializer,
    AssetWriteSerializer,
    CampaignSerializer,
    CampaignUpdateSerializer,
    CampaignWriteSerializer,
    GenerateSerializer,
)


def _org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class AssetListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["marketing"])
    def get(self, request: Request) -> Response:
        items = get_marketing_service().list_assets(request.user.id, _org(request))
        return Response(AssetSerializer(items, many=True).data)

    @extend_schema(request=AssetWriteSerializer, tags=["marketing"])
    def post(self, request: Request) -> Response:
        serializer = AssetWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_marketing_service().create_asset(request.user.id, org_id, data)
        return Response(AssetSerializer(item).data, status=status.HTTP_201_CREATED)


class AssetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["marketing"])
    def get(self, request: Request, asset_id: UUID) -> Response:
        return Response(
            AssetSerializer(get_marketing_service().get_asset(request.user.id, asset_id)).data
        )

    @extend_schema(request=AssetUpdateSerializer, tags=["marketing"])
    def patch(self, request: Request, asset_id: UUID) -> Response:
        serializer = AssetUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_marketing_service().update_asset(
            request.user.id, asset_id, serializer.validated_data
        )
        return Response(AssetSerializer(item).data)

    @extend_schema(tags=["marketing"])
    def delete(self, request: Request, asset_id: UUID) -> Response:
        get_marketing_service().delete_asset(request.user.id, asset_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssetImproveView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["marketing"])
    def post(self, request: Request, asset_id: UUID) -> Response:
        item = get_marketing_service().improve_asset(request.user.id, asset_id)
        return Response(AssetSerializer(item).data)


class GenerateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=GenerateSerializer, tags=["marketing"])
    def post(self, request: Request) -> Response:
        serializer = GenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        item = get_marketing_service().generate(
            request.user.id,
            data["organization_id"],
            asset_type=data["type"],
            prompt=data["prompt"],
            tone=data.get("tone") or "professional",
            product_name=data.get("product_name") or "",
        )
        return Response(AssetSerializer(item).data, status=status.HTTP_201_CREATED)


class CampaignListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["marketing"])
    def get(self, request: Request) -> Response:
        items = get_marketing_service().list_campaigns(request.user.id, _org(request))
        return Response(CampaignSerializer(items, many=True).data)

    @extend_schema(request=CampaignWriteSerializer, tags=["marketing"])
    def post(self, request: Request) -> Response:
        serializer = CampaignWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_marketing_service().create_campaign(request.user.id, org_id, data)
        return Response(CampaignSerializer(item).data, status=status.HTTP_201_CREATED)


class CampaignDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["marketing"])
    def get(self, request: Request, campaign_id: UUID) -> Response:
        return Response(
            CampaignSerializer(
                get_marketing_service().get_campaign(request.user.id, campaign_id)
            ).data
        )

    @extend_schema(request=CampaignUpdateSerializer, tags=["marketing"])
    def patch(self, request: Request, campaign_id: UUID) -> Response:
        serializer = CampaignUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_marketing_service().update_campaign(
            request.user.id, campaign_id, serializer.validated_data
        )
        return Response(CampaignSerializer(item).data)

    @extend_schema(tags=["marketing"])
    def delete(self, request: Request, campaign_id: UUID) -> Response:
        get_marketing_service().delete_campaign(request.user.id, campaign_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

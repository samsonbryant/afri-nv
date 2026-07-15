"""Organization API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.organizations.application.dto import (
    AddMemberDTO,
    CreateOrganizationDTO,
    UpdateOrganizationDTO,
)
from apps.organizations.infrastructure.dependencies import get_organization_service
from apps.organizations.interfaces.serializers.serializers import (
    AddMemberSerializer,
    MembershipSerializer,
    OrganizationSerializer,
    OrganizationUpdateSerializer,
    OrganizationWriteSerializer,
)


class OrganizationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OrganizationSerializer(many=True)}, tags=["organizations"])
    def get(self, request: Request) -> Response:
        service = get_organization_service()
        orgs = service.list_for_user(request.user.id)
        return Response(OrganizationSerializer(orgs, many=True).data)

    @extend_schema(
        request=OrganizationWriteSerializer,
        responses={201: OrganizationSerializer},
        tags=["organizations"],
    )
    def post(self, request: Request) -> Response:
        serializer = OrganizationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_organization_service()
        org = service.create(
            request.user.id,
            CreateOrganizationDTO(
                name=data["name"],
                slug=data["slug"],
                plan=data.get("plan", "free"),
            ),
        )
        return Response(OrganizationSerializer(org).data, status=status.HTTP_201_CREATED)


class OrganizationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OrganizationSerializer}, tags=["organizations"])
    def get(self, request: Request, org_id: UUID) -> Response:
        service = get_organization_service()
        org = service.get(request.user.id, org_id)
        return Response(OrganizationSerializer(org).data)

    @extend_schema(
        request=OrganizationUpdateSerializer,
        responses={200: OrganizationSerializer},
        tags=["organizations"],
    )
    def patch(self, request: Request, org_id: UUID) -> Response:
        serializer = OrganizationUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = get_organization_service()
        org = service.update(
            request.user.id,
            org_id,
            UpdateOrganizationDTO(**serializer.validated_data),
        )
        return Response(OrganizationSerializer(org).data)

    @extend_schema(responses={204: None}, tags=["organizations"])
    def delete(self, request: Request, org_id: UUID) -> Response:
        service = get_organization_service()
        service.delete(request.user.id, org_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MembershipListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MembershipSerializer(many=True)}, tags=["organizations"])
    def get(self, request: Request, org_id: UUID) -> Response:
        service = get_organization_service()
        members = service.list_members(request.user.id, org_id)
        return Response(MembershipSerializer(members, many=True).data)

    @extend_schema(
        request=AddMemberSerializer,
        responses={201: MembershipSerializer},
        tags=["organizations"],
    )
    def post(self, request: Request, org_id: UUID) -> Response:
        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_organization_service()
        membership = service.add_member(
            request.user.id,
            org_id,
            AddMemberDTO(user_id=data["user_id"], role=data.get("role", "member")),
        )
        return Response(
            MembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )


class MembershipDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={204: None}, tags=["organizations"])
    def delete(self, request: Request, org_id: UUID, membership_id: UUID) -> Response:
        service = get_organization_service()
        service.remove_member(request.user.id, org_id, membership_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

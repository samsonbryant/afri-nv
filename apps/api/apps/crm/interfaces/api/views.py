"""CRM API views."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
from apps.crm.infrastructure.dependencies import get_crm_service
from apps.crm.interfaces.serializers.serializers import (
    ActivitySerializer,
    ActivityUpdateSerializer,
    ActivityWriteSerializer,
    CompanySerializer,
    CompanyUpdateSerializer,
    CompanyWriteSerializer,
    ContactSerializer,
    ContactUpdateSerializer,
    ContactWriteSerializer,
    LeadSerializer,
    LeadUpdateSerializer,
    LeadWriteSerializer,
    NoteSerializer,
    NoteUpdateSerializer,
    NoteWriteSerializer,
    OpportunitySerializer,
    OpportunityUpdateSerializer,
    OpportunityWriteSerializer,
)


def _require_org(request: Request) -> UUID:
    org_id = request.query_params.get("organization_id")
    if not org_id:
        raise ValidationError("organization_id is required.")
    return UUID(org_id)


class CompanyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request) -> Response:
        items = get_crm_service().list_companies(request.user.id, _require_org(request))
        return Response(CompanySerializer(items, many=True).data)

    @extend_schema(request=CompanyWriteSerializer, tags=["crm"])
    def post(self, request: Request) -> Response:
        serializer = CompanyWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_crm_service().create_company(request.user.id, org_id, data)
        return Response(CompanySerializer(item).data, status=status.HTTP_201_CREATED)


class CompanyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request, company_id: UUID) -> Response:
        item = get_crm_service().get_company(request.user.id, company_id)
        return Response(CompanySerializer(item).data)

    @extend_schema(request=CompanyUpdateSerializer, tags=["crm"])
    def patch(self, request: Request, company_id: UUID) -> Response:
        serializer = CompanyUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_crm_service().update_company(
            request.user.id, company_id, serializer.validated_data
        )
        return Response(CompanySerializer(item).data)

    @extend_schema(tags=["crm"])
    def delete(self, request: Request, company_id: UUID) -> Response:
        get_crm_service().delete_company(request.user.id, company_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request) -> Response:
        items = get_crm_service().list_contacts(request.user.id, _require_org(request))
        return Response(ContactSerializer(items, many=True).data)

    @extend_schema(request=ContactWriteSerializer, tags=["crm"])
    def post(self, request: Request) -> Response:
        serializer = ContactWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_crm_service().create_contact(request.user.id, org_id, data)
        return Response(ContactSerializer(item).data, status=status.HTTP_201_CREATED)


class ContactDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request, contact_id: UUID) -> Response:
        return Response(
            ContactSerializer(get_crm_service().get_contact(request.user.id, contact_id)).data
        )

    @extend_schema(request=ContactUpdateSerializer, tags=["crm"])
    def patch(self, request: Request, contact_id: UUID) -> Response:
        serializer = ContactUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_crm_service().update_contact(
            request.user.id, contact_id, serializer.validated_data
        )
        return Response(ContactSerializer(item).data)

    @extend_schema(tags=["crm"])
    def delete(self, request: Request, contact_id: UUID) -> Response:
        get_crm_service().delete_contact(request.user.id, contact_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeadListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request) -> Response:
        items = get_crm_service().list_leads(request.user.id, _require_org(request))
        return Response(LeadSerializer(items, many=True).data)

    @extend_schema(request=LeadWriteSerializer, tags=["crm"])
    def post(self, request: Request) -> Response:
        serializer = LeadWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_crm_service().create_lead(request.user.id, org_id, data)
        return Response(LeadSerializer(item).data, status=status.HTTP_201_CREATED)


class LeadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request, lead_id: UUID) -> Response:
        return Response(LeadSerializer(get_crm_service().get_lead(request.user.id, lead_id)).data)

    @extend_schema(request=LeadUpdateSerializer, tags=["crm"])
    def patch(self, request: Request, lead_id: UUID) -> Response:
        serializer = LeadUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_crm_service().update_lead(request.user.id, lead_id, serializer.validated_data)
        return Response(LeadSerializer(item).data)

    @extend_schema(tags=["crm"])
    def delete(self, request: Request, lead_id: UUID) -> Response:
        get_crm_service().delete_lead(request.user.id, lead_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeadConvertView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def post(self, request: Request, lead_id: UUID) -> Response:
        opp = get_crm_service().convert_lead(request.user.id, lead_id)
        return Response(OpportunitySerializer(opp).data, status=status.HTTP_201_CREATED)


class OpportunityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request) -> Response:
        items = get_crm_service().list_opportunities(request.user.id, _require_org(request))
        return Response(OpportunitySerializer(items, many=True).data)

    @extend_schema(request=OpportunityWriteSerializer, tags=["crm"])
    def post(self, request: Request) -> Response:
        serializer = OpportunityWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_crm_service().create_opportunity(request.user.id, org_id, data)
        return Response(OpportunitySerializer(item).data, status=status.HTTP_201_CREATED)


class OpportunityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request, opportunity_id: UUID) -> Response:
        return Response(
            OpportunitySerializer(
                get_crm_service().get_opportunity(request.user.id, opportunity_id)
            ).data
        )

    @extend_schema(request=OpportunityUpdateSerializer, tags=["crm"])
    def patch(self, request: Request, opportunity_id: UUID) -> Response:
        serializer = OpportunityUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_crm_service().update_opportunity(
            request.user.id, opportunity_id, serializer.validated_data
        )
        return Response(OpportunitySerializer(item).data)

    @extend_schema(tags=["crm"])
    def delete(self, request: Request, opportunity_id: UUID) -> Response:
        get_crm_service().delete_opportunity(request.user.id, opportunity_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PipelineView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request) -> Response:
        pipeline = get_crm_service().pipeline(request.user.id, _require_org(request))
        return Response(
            {
                stage: OpportunitySerializer(items, many=True).data
                for stage, items in pipeline.stages.items()
            }
        )


class NoteListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request) -> Response:
        items = get_crm_service().list_notes(request.user.id, _require_org(request))
        return Response(NoteSerializer(items, many=True).data)

    @extend_schema(request=NoteWriteSerializer, tags=["crm"])
    def post(self, request: Request) -> Response:
        serializer = NoteWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_crm_service().create_note(request.user.id, org_id, data)
        return Response(NoteSerializer(item).data, status=status.HTTP_201_CREATED)


class NoteDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request, note_id: UUID) -> Response:
        return Response(NoteSerializer(get_crm_service().get_note(request.user.id, note_id)).data)

    @extend_schema(request=NoteUpdateSerializer, tags=["crm"])
    def patch(self, request: Request, note_id: UUID) -> Response:
        serializer = NoteUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_crm_service().update_note(request.user.id, note_id, serializer.validated_data)
        return Response(NoteSerializer(item).data)

    @extend_schema(tags=["crm"])
    def delete(self, request: Request, note_id: UUID) -> Response:
        get_crm_service().delete_note(request.user.id, note_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request) -> Response:
        items = get_crm_service().list_activities(request.user.id, _require_org(request))
        return Response(ActivitySerializer(items, many=True).data)

    @extend_schema(request=ActivityWriteSerializer, tags=["crm"])
    def post(self, request: Request) -> Response:
        serializer = ActivityWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        org_id = data.pop("organization_id")
        item = get_crm_service().create_activity(request.user.id, org_id, data)
        return Response(ActivitySerializer(item).data, status=status.HTTP_201_CREATED)


class ActivityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def get(self, request: Request, activity_id: UUID) -> Response:
        return Response(
            ActivitySerializer(get_crm_service().get_activity(request.user.id, activity_id)).data
        )

    @extend_schema(request=ActivityUpdateSerializer, tags=["crm"])
    def patch(self, request: Request, activity_id: UUID) -> Response:
        serializer = ActivityUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        item = get_crm_service().update_activity(
            request.user.id, activity_id, serializer.validated_data
        )
        return Response(ActivitySerializer(item).data)

    @extend_schema(tags=["crm"])
    def delete(self, request: Request, activity_id: UUID) -> Response:
        get_crm_service().delete_activity(request.user.id, activity_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityAiFollowUpView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["crm"])
    def post(self, request: Request, activity_id: UUID) -> Response:
        result = get_crm_service().ai_follow_up(request.user.id, activity_id)
        return Response(
            {
                "content": result["content"],
                "note": NoteSerializer(result["note"]).data,
                "activity": ActivitySerializer(result["activity"]).data,
            },
            status=status.HTTP_201_CREATED,
        )

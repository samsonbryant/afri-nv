"""Organization API views."""

from __future__ import annotations

from uuid import UUID

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.domain.exceptions import ValidationError
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


def _bootstrap_payload(user_id: UUID, org_id: UUID | None = None) -> dict:
    service = get_organization_service()
    organizations = service.list_for_user(user_id)
    org = service.get(user_id, org_id) if org_id else (organizations[0] if organizations else None)
    if org is None:
        return {
            "organization": None,
            "subscription_status": "none",
            "trial_end": None,
            "payment_method_ready": False,
            "profile_complete": False,
            "next_step": "organization",
        }

    from apps.billing.infrastructure.models import Subscription

    subscription = (
        Subscription.objects.filter(organization_id=org.id)
        .exclude(status=Subscription.Status.CANCELLED)
        .select_related("plan")
        .order_by("-created_at")
        .first()
    )
    now = timezone.now()
    entitlement_active = bool(
        subscription
        and (
            subscription.status == Subscription.Status.ACTIVE
            or (
                subscription.status == Subscription.Status.TRIALING
                and subscription.trial_end
                and subscription.trial_end > now
            )
        )
    )
    payment_ready = bool(
        subscription
        and subscription.payment_method_ref
        and (
            (subscription.payment_method == "card" and subscription.auto_charge)
            or (
                subscription.status == Subscription.Status.ACTIVE
                and subscription.payment_method in {"mtn_momo", "orange_money"}
            )
        )
    )
    required_profile = bool(org.name and org.industry and org.description and org.logo_url)
    profile_complete = bool(org.onboarding_completed_at or required_profile)
    if (
        profile_complete
        and not org.onboarding_completed_at
        and entitlement_active
        and payment_ready
    ):
        service.update(user_id, org.id, UpdateOrganizationDTO(onboarding_completed=True))
        org = service.get(user_id, org.id)

    next_step = "dashboard"
    if not entitlement_active or not payment_ready:
        next_step = "trial"
    elif not profile_complete:
        next_step = "profile"
    return {
        "organization": OrganizationSerializer(org).data,
        "subscription_status": subscription.status if subscription else "none",
        "trial_end": subscription.trial_end if subscription else None,
        "payment_method_ready": payment_ready,
        "entitlement_active": entitlement_active,
        "profile_complete": profile_complete,
        "next_step": next_step,
    }


class OrganizationBootstrapView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["organizations"])
    def get(self, request: Request) -> Response:
        raw_org_id = request.query_params.get("organization_id")
        try:
            org_id = UUID(raw_org_id) if raw_org_id else None
        except ValueError as exc:
            raise ValidationError("organization_id must be a valid UUID.") from exc
        return Response(_bootstrap_payload(request.user.id, org_id))


class CompleteOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["organizations"])
    def post(self, request: Request, org_id: UUID) -> Response:
        state = _bootstrap_payload(request.user.id, org_id)
        if not state.get("entitlement_active") or not state.get("payment_method_ready"):
            raise ValidationError("Complete card or mobile-money payment before continuing.")
        org = get_organization_service().get(request.user.id, org_id)
        missing = [
            label
            for label, value in (
                ("organization name", org.name),
                ("industry", org.industry),
                ("business description", org.description),
                ("logo", org.logo_url),
            )
            if not value
        ]
        if missing:
            raise ValidationError(f"Complete required business fields: {', '.join(missing)}.")
        updated = get_organization_service().update(
            request.user.id,
            org_id,
            UpdateOrganizationDTO(onboarding_completed=True),
        )
        return Response(
            {
                "organization": OrganizationSerializer(updated).data,
                "profile_complete": True,
                "next_step": "dashboard",
            }
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
                description=data.get("description", ""),
                industry=data.get("industry", ""),
                website=data.get("website", ""),
                phone=data.get("phone", ""),
                address=data.get("address", ""),
            ),
        )
        return Response(OrganizationSerializer(org).data, status=status.HTTP_201_CREATED)


class OrganizationDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
        service = get_organization_service()
        if request.FILES.get("logo"):
            org = service.update_logo(request.user.id, org_id, request.FILES["logo"])
            # Also apply any accompanying text fields.
            text = {k: v for k, v in request.data.items() if k != "logo"}
            if text:
                serializer = OrganizationUpdateSerializer(data=text, partial=True)
                serializer.is_valid(raise_exception=True)
                org = service.update(
                    request.user.id,
                    org_id,
                    UpdateOrganizationDTO(**serializer.validated_data),
                )
            return Response(OrganizationSerializer(org).data)

        serializer = OrganizationUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
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

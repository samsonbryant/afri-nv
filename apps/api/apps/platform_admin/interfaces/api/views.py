"""Platform admin API views — staff only."""

from __future__ import annotations

from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.infrastructure.dependencies import get_billing_service
from apps.billing.interfaces.serializers.serializers import ManualPaymentRejectSerializer
from apps.platform_admin.infrastructure.dependencies import get_platform_admin_service
from apps.platform_admin.interfaces.serializers.serializers import (
    AdminUserCreateSerializer,
    AdminUserUpdateSerializer,
    PlatformSettingUpdateSerializer,
)


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().list_users())

    @extend_schema(request=AdminUserCreateSerializer, tags=["admin"])
    def post(self, request: Request) -> Response:
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_platform_admin_service().create_user(serializer.validated_data)
        return Response(user, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request, user_id: UUID) -> Response:
        return Response(get_platform_admin_service().get_user(user_id))

    @extend_schema(request=AdminUserUpdateSerializer, tags=["admin"])
    def patch(self, request: Request, user_id: UUID) -> Response:
        serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(
            get_platform_admin_service().update_user(user_id, serializer.validated_data)
        )


class AdminOrganizationsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().list_organizations())


class AdminSubscriptionsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().list_subscriptions())


class AdminPaymentsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().list_payments())


class AdminManualPaymentsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        status_filter = request.query_params.get("status")
        return Response(get_billing_service().list_all_manual_payments(status=status_filter))


class AdminManualPaymentApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def post(self, request: Request, request_id: UUID) -> Response:
        return Response(get_billing_service().approve_manual_payment(request.user.id, request_id))


class AdminManualPaymentRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(request=ManualPaymentRejectSerializer, tags=["admin"])
    def post(self, request: Request, request_id: UUID) -> Response:
        serializer = ManualPaymentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            get_billing_service().reject_manual_payment(
                request.user.id,
                request_id,
                serializer.validated_data.get("reason", ""),
            )
        )


class AdminAnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().analytics_overview())


class AdminAiUsageView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().ai_usage())


class AdminAuditLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().audit_logs())


class AdminSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @extend_schema(tags=["admin"])
    def get(self, request: Request) -> Response:
        return Response(get_platform_admin_service().settings_summary())

    @extend_schema(request=PlatformSettingUpdateSerializer, tags=["admin"])
    def patch(self, request: Request) -> Response:
        key = request.data.get("key") or request.query_params.get("key")
        serializer = PlatformSettingUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return Response(
            get_platform_admin_service().update_setting(key, data["value"], data.get("description"))
        )

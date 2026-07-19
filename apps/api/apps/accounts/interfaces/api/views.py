"""Accounts API views."""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.application.dto import (
    ChangePasswordDTO,
    LoginDTO,
    RegisterUserDTO,
    UpdateProfileDTO,
)
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.accounts.interfaces.serializers.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    TokenPairSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)
from apps.organizations.infrastructure.dependencies import get_organization_service
from apps.organizations.interfaces.serializers.serializers import OrganizationSerializer


def _absolute_avatar(request: Request, user_data: dict) -> dict:
    avatar = user_data.get("avatar")
    if avatar and isinstance(avatar, str) and avatar.startswith("/"):
        user_data = {**user_data, "avatar": request.build_absolute_uri(avatar)}
    return user_data


def _ensure_organization(user) -> dict:
    display = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
    if not display:
        display = getattr(user, "email", "Personal").split("@")[0]
    org = get_organization_service().ensure_default(user.id, display_name=display)
    return OrganizationSerializer(org).data


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        request=RegisterSerializer,
        responses={201: UserSerializer},
        tags=["auth"],
    )
    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_auth_service()
        user, tokens = service.register(
            RegisterUserDTO(
                email=data["email"],
                password=data["password"],
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
            )
        )
        return Response(
            {
                "user": _absolute_avatar(request, UserSerializer(user).data),
                "organization": _ensure_organization(user),
                "tokens": TokenPairSerializer(tokens).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        request=LoginSerializer,
        responses={200: TokenPairSerializer},
        tags=["auth"],
    )
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_auth_service()
        user, tokens = service.login(LoginDTO(email=data["email"], password=data["password"]))
        return Response(
            {
                "user": _absolute_avatar(request, UserSerializer(user).data),
                "organization": _ensure_organization(user),
                "tokens": TokenPairSerializer(tokens).data,
            }
        )


class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(tags=["auth"])
    def post(self, request: Request) -> Response:
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"error": {"code": "validation_error", "message": "refresh is required"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        service = get_auth_service()
        tokens = service.refresh(refresh)
        return Response(TokenPairSerializer(tokens).data)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer}, tags=["auth"])
    def get(self, request: Request) -> Response:
        service = get_auth_service()
        user = service.get_me(request.user.id)
        return Response(_absolute_avatar(request, UserSerializer(user).data))

    @extend_schema(request=UpdateProfileSerializer, responses={200: UserSerializer}, tags=["auth"])
    def patch(self, request: Request) -> Response:
        serializer = UpdateProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        service = get_auth_service()
        user = service.update_profile(
            request.user.id,
            UpdateProfileDTO(
                first_name=data.get("first_name"),
                last_name=data.get("last_name"),
            ),
        )
        return Response(_absolute_avatar(request, UserSerializer(user).data))


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, tags=["auth"])
    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        get_auth_service().change_password(
            request.user.id,
            ChangePasswordDTO(
                current_password=data["current_password"],
                new_password=data["new_password"],
            ),
        )
        return Response({"detail": "Password updated."})


class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(responses={200: UserSerializer}, tags=["auth"])
    def post(self, request: Request) -> Response:
        file = request.FILES.get("avatar") or request.FILES.get("file")
        if file is None:
            return Response(
                {"error": {"code": "validation_error", "message": "avatar file is required"}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = get_auth_service().update_avatar(request.user.id, file)
        return Response(_absolute_avatar(request, UserSerializer(user).data))

"""Accounts API views."""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.application.dto import LoginDTO, RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.accounts.interfaces.serializers.serializers import (
    LoginSerializer,
    RegisterSerializer,
    TokenPairSerializer,
    UserSerializer,
)


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
                "user": UserSerializer(user).data,
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
                "user": UserSerializer(user).data,
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
        return Response(UserSerializer(user).data)

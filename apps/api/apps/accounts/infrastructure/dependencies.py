"""Accounts dependency injection."""

from __future__ import annotations

from apps.accounts.application.services import AuthService
from apps.accounts.infrastructure.repositories import DjangoUserRepository


def get_user_repository() -> DjangoUserRepository:
    return DjangoUserRepository()


def get_auth_service() -> AuthService:
    return AuthService(user_repository=get_user_repository())

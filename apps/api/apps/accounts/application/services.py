"""Accounts application services / use cases."""

from __future__ import annotations

from uuid import UUID

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import UploadedFile
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.application.dto import (
    ChangePasswordDTO,
    LoginDTO,
    RegisterUserDTO,
    TokenPairDTO,
    UpdateProfileDTO,
    UserDTO,
)
from apps.accounts.domain.entities import UserEntity
from apps.accounts.domain.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    InvalidPasswordError,
    UserNotFoundError,
)
from apps.accounts.domain.repositories import AbstractUserRepository


class AuthService:
    """Registration, login, and profile use cases."""

    def __init__(self, user_repository: AbstractUserRepository) -> None:
        self._users = user_repository

    def register(self, data: RegisterUserDTO) -> tuple[UserDTO, TokenPairDTO]:
        if self._users.get_by_email(data.email.lower()):
            raise EmailAlreadyExistsError()

        user = self._users.create(
            email=data.email.lower(),
            password=data.password,
            first_name=data.first_name,
            last_name=data.last_name,
        )
        tokens = self._issue_tokens(user.id)
        return self._to_dto(user), tokens

    def login(self, data: LoginDTO) -> tuple[UserDTO, TokenPairDTO]:
        user = self._users.get_by_email(data.email.lower())
        if user is None or not self._users.check_password(user.id, data.password):
            raise InvalidCredentialsError()
        if not user.is_active:
            raise InvalidCredentialsError("User account is inactive.")
        return self._to_dto(user), self._issue_tokens(user.id)

    def get_me(self, user_id: UUID) -> UserDTO:
        user = self._users.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError()
        return self._to_dto(user)

    def update_profile(self, user_id: UUID, data: UpdateProfileDTO) -> UserDTO:
        user = self._users.get_by_id(user_id)
        if user is None:
            raise UserNotFoundError()
        if data.first_name is not None:
            user.first_name = data.first_name
        if data.last_name is not None:
            user.last_name = data.last_name
        return self._to_dto(self._users.update(user))

    def change_password(self, user_id: UUID, data: ChangePasswordDTO) -> None:
        if not self._users.check_password(user_id, data.current_password):
            raise InvalidPasswordError()
        self._users.set_password(user_id, data.new_password)

    def update_avatar(self, user_id: UUID, file: UploadedFile) -> UserDTO:
        if self._users.get_by_id(user_id) is None:
            raise UserNotFoundError()
        return self._to_dto(self._users.set_avatar(user_id, file))

    def refresh(self, refresh_token: str) -> TokenPairDTO:
        from rest_framework_simplejwt.exceptions import TokenError

        User = get_user_model()
        try:
            token = RefreshToken(refresh_token)
            user_id = token.get("user_id")
            try:
                token.blacklist()
            except AttributeError:
                pass
            django_user = User.objects.get(pk=user_id)
            new_refresh = RefreshToken.for_user(django_user)
            return TokenPairDTO(
                access=str(new_refresh.access_token),
                refresh=str(new_refresh),
            )
        except (TokenError, User.DoesNotExist) as exc:
            raise InvalidCredentialsError("Invalid or expired refresh token.") from exc

    def _issue_tokens(self, user_id: UUID) -> TokenPairDTO:
        User = get_user_model()
        django_user = User.objects.get(pk=user_id)
        refresh = RefreshToken.for_user(django_user)
        return TokenPairDTO(access=str(refresh.access_token), refresh=str(refresh))

    @staticmethod
    def _to_dto(user: UserEntity) -> UserDTO:
        return UserDTO(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            avatar=user.avatar,
            is_active=user.is_active,
            is_staff=user.is_staff,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

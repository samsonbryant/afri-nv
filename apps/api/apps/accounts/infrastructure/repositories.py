"""Django implementation of the user repository."""

from __future__ import annotations

from uuid import UUID

from django.core.files.uploadedfile import UploadedFile

from apps.accounts.domain.entities import UserEntity
from apps.accounts.domain.repositories import AbstractUserRepository
from apps.accounts.infrastructure.models import User


class DjangoUserRepository(AbstractUserRepository):
    def get_by_id(self, user_id: UUID) -> UserEntity | None:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
        return self._to_entity(user)

    def get_by_email(self, email: str) -> UserEntity | None:
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None
        return self._to_entity(user)

    def create(
        self,
        *,
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
        is_staff: bool = False,
        is_superuser: bool = False,
        is_active: bool = True,
    ) -> UserEntity:
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_active=is_active,
        )
        return self._to_entity(user)

    def update(self, user: UserEntity) -> UserEntity:
        orm = User.objects.get(pk=user.id)
        orm.first_name = user.first_name
        orm.last_name = user.last_name
        orm.is_active = user.is_active
        orm.is_staff = user.is_staff
        orm.is_superuser = user.is_superuser
        orm.save(
            update_fields=[
                "first_name",
                "last_name",
                "is_active",
                "is_staff",
                "is_superuser",
                "updated_at",
            ]
        )
        return self._to_entity(orm)

    def set_password(self, user_id: UUID, password: str) -> None:
        orm = User.objects.get(pk=user_id)
        orm.set_password(password)
        orm.save(update_fields=["password", "updated_at"])

    def set_avatar(self, user_id: UUID, file: UploadedFile) -> UserEntity:
        orm = User.objects.get(pk=user_id)
        if orm.avatar:
            orm.avatar.delete(save=False)
        orm.avatar = file
        orm.save(update_fields=["avatar", "updated_at"])
        return self._to_entity(orm)

    def check_password(self, user_id: UUID, password: str) -> bool:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return False
        return user.check_password(password)

    @staticmethod
    def _to_entity(user: User) -> UserEntity:
        avatar_url = user.avatar.url if user.avatar else None
        return UserEntity(
            id=user.id,
            email=user.email,
            first_name=user.first_name or "",
            last_name=user.last_name or "",
            is_active=user.is_active,
            is_staff=user.is_staff,
            is_superuser=user.is_superuser,
            avatar=avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

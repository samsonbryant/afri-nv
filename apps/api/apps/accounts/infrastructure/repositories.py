"""Django implementation of the user repository."""

from __future__ import annotations

from uuid import UUID

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
    ) -> UserEntity:
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        return self._to_entity(user)

    def update(self, user: UserEntity) -> UserEntity:
        orm = User.objects.get(pk=user.id)
        orm.first_name = user.first_name
        orm.last_name = user.last_name
        orm.is_active = user.is_active
        orm.save(update_fields=["first_name", "last_name", "is_active", "updated_at"])
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
            avatar=avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

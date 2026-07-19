"""Accounts repository interfaces."""

from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

from django.core.files.uploadedfile import UploadedFile

from apps.accounts.domain.entities import UserEntity


class AbstractUserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: UUID) -> UserEntity | None: ...

    @abstractmethod
    def get_by_email(self, email: str) -> UserEntity | None: ...

    @abstractmethod
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
    ) -> UserEntity: ...

    @abstractmethod
    def update(self, user: UserEntity) -> UserEntity: ...

    @abstractmethod
    def set_password(self, user_id: UUID, password: str) -> None: ...

    @abstractmethod
    def set_avatar(self, user_id: UUID, file: UploadedFile) -> UserEntity: ...

    @abstractmethod
    def check_password(self, user_id: UUID, password: str) -> bool: ...

"""Accounts repository interfaces."""

from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

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
    ) -> UserEntity: ...

    @abstractmethod
    def update(self, user: UserEntity) -> UserEntity: ...

    @abstractmethod
    def check_password(self, user_id: UUID, password: str) -> bool: ...

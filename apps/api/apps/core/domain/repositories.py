"""Core domain repository interfaces (none for shared core)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from uuid import UUID

T = TypeVar("T")


class AbstractRepository(ABC, Generic[T]):
    """Base repository interface."""

    @abstractmethod
    def get_by_id(self, entity_id: UUID) -> T | None:
        """Fetch an entity by UUID."""

    @abstractmethod
    def save(self, entity: T) -> T:
        """Persist an entity."""

    @abstractmethod
    def delete(self, entity_id: UUID) -> None:
        """Delete an entity by UUID."""

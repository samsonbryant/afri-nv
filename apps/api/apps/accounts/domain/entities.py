"""Accounts domain entities."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class UserEntity:
    id: UUID
    email: str
    first_name: str
    last_name: str
    is_active: bool
    avatar: str | None
    created_at: datetime
    updated_at: datetime

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

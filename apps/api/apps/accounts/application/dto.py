"""Accounts application DTOs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class RegisterUserDTO:
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""


@dataclass(slots=True)
class LoginDTO:
    email: str
    password: str


@dataclass(slots=True)
class TokenPairDTO:
    access: str
    refresh: str


@dataclass(slots=True)
class UserDTO:
    id: UUID
    email: str
    first_name: str
    last_name: str
    avatar: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

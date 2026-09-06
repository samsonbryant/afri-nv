"""Organization domain entities."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from uuid import UUID


class MembershipRole(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class Plan(StrEnum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass(slots=True)
class OrganizationEntity:
    id: UUID
    name: str
    slug: str
    plan: str
    created_at: datetime
    updated_at: datetime
    description: str = ""
    industry: str = ""
    website: str = ""
    phone: str = ""
    address: str = ""
    business_context: dict = field(default_factory=dict)
    logo_url: str | None = None


@dataclass(slots=True)
class MembershipEntity:
    id: UUID
    user_id: UUID
    organization_id: UUID
    role: str
    created_at: datetime
    updated_at: datetime

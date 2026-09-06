"""Organization application DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class CreateOrganizationDTO:
    name: str
    slug: str
    plan: str = "free"
    description: str = ""
    industry: str = ""
    website: str = ""
    phone: str = ""
    address: str = ""


@dataclass(slots=True)
class UpdateOrganizationDTO:
    name: str | None = None
    plan: str | None = None
    description: str | None = None
    industry: str | None = None
    website: str | None = None
    phone: str | None = None
    address: str | None = None
    business_context: dict | None = None


@dataclass(slots=True)
class OrganizationDTO:
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
class MembershipDTO:
    id: UUID
    user_id: UUID
    organization_id: UUID
    role: str
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class AddMemberDTO:
    user_id: UUID
    role: str = "member"

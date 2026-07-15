"""CRM DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID


@dataclass(slots=True)
class CompanyDTO:
    id: UUID
    organization_id: UUID
    name: str
    domain: str
    industry: str
    size: str
    website: str
    phone: str
    address: str
    metadata: dict
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class ContactDTO:
    id: UUID
    organization_id: UUID
    company_id: UUID | None
    first_name: str
    last_name: str
    email: str
    phone: str
    title: str
    status: str
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class LeadDTO:
    id: UUID
    organization_id: UUID
    contact_id: UUID | None
    company_id: UUID | None
    title: str
    source: str
    status: str
    score: int
    owner_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class OpportunityDTO:
    id: UUID
    organization_id: UUID
    company_id: UUID
    contact_id: UUID | None
    name: str
    amount: Decimal
    currency: str
    stage: str
    probability: int
    close_date: date | None
    owner_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class NoteDTO:
    id: UUID
    organization_id: UUID
    related_type: str
    object_id: UUID
    body: str
    author_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class ActivityDTO:
    id: UUID
    organization_id: UUID
    type: str
    subject: str
    due_at: datetime | None
    completed_at: datetime | None
    related_type: str
    related_id: UUID | None
    assignee_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class PipelineDTO:
    stages: dict[str, list[OpportunityDTO]] = field(default_factory=dict)

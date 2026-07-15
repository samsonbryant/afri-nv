from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class PlanDTO:
    id: UUID
    code: str
    name: str
    amount_cents: int
    currency: str
    interval: str
    trial_days: int
    features: dict
    is_active: bool


@dataclass(slots=True)
class SubscriptionDTO:
    id: UUID
    organization_id: UUID
    plan_id: UUID
    plan_code: str
    status: str
    dodo_subscription_id: str
    current_period_start: datetime | None
    current_period_end: datetime | None
    cancel_at_period_end: bool
    trial_end: datetime | None
    created_at: datetime


@dataclass(slots=True)
class InvoiceDTO:
    id: UUID
    organization_id: UUID
    subscription_id: UUID | None
    number: str
    amount_cents: int
    tax_cents: int
    status: str
    hosted_url: str
    pdf_url: str
    issued_at: datetime | None
    paid_at: datetime | None


@dataclass(slots=True)
class UsageDTO:
    metric: str
    quantity: int
    period_start: datetime
    period_end: datetime

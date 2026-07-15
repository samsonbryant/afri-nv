"""Billing domain enums."""

from __future__ import annotations

from enum import StrEnum


class PlanInterval(StrEnum):
    MONTH = "month"
    YEAR = "year"


class SubscriptionStatus(StrEnum):
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class InvoiceStatus(StrEnum):
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    VOID = "void"
    UNCOLLECTIBLE = "uncollectible"


class UsageMetric(StrEnum):
    AI_TOKENS = "ai_tokens"
    API_CALLS = "api_calls"
    SEATS = "seats"

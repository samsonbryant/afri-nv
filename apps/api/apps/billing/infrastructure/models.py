"""Billing ORM models."""

from __future__ import annotations

from django.db import models

from infrastructure.persistence.base import BaseModel


class Plan(BaseModel):
    class Interval(models.TextChoices):
        MONTH = "month", "Month"
        YEAR = "year", "Year"

    code = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default="usd")
    interval = models.CharField(max_length=16, choices=Interval.choices, default=Interval.MONTH)
    trial_days = models.PositiveIntegerField(default=0)
    features = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "billing_plan"
        ordering = ("amount_cents",)

    def __str__(self) -> str:
        return self.code


class Subscription(BaseModel):
    class Status(models.TextChoices):
        TRIALING = "trialing", "Trialing"
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past Due"
        CANCELLED = "cancelled", "Cancelled"
        PAUSED = "paused", "Paused"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="subscriptions"
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.TRIALING, db_index=True
    )
    dodo_subscription_id = models.CharField(max_length=128, blank=True, default="", db_index=True)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    trial_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "billing_subscription"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self) -> str:
        return f"{self.organization_id}:{self.plan_id}"


class Invoice(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open"
        PAID = "paid", "Paid"
        VOID = "void", "Void"
        UNCOLLECTIBLE = "uncollectible", "Uncollectible"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="invoices"
    )
    subscription = models.ForeignKey(
        Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices"
    )
    number = models.CharField(max_length=64, unique=True)
    amount_cents = models.PositiveIntegerField(default=0)
    tax_cents = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.OPEN, db_index=True
    )
    hosted_url = models.URLField(blank=True, default="")
    pdf_url = models.URLField(blank=True, default="")
    issued_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "billing_invoice"
        ordering = ("-issued_at", "-created_at")

    def __str__(self) -> str:
        return self.number


class Coupon(BaseModel):
    code = models.SlugField(max_length=64, unique=True)
    percent_off = models.PositiveIntegerField(null=True, blank=True)
    amount_off = models.PositiveIntegerField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    max_redemptions = models.PositiveIntegerField(null=True, blank=True)
    times_redeemed = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "billing_coupon"
        ordering = ("code",)

    def __str__(self) -> str:
        return self.code


class PaymentEvent(BaseModel):
    provider = models.CharField(max_length=32, default="dodo")
    event_type = models.CharField(max_length=128, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "billing_payment_event"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.provider}:{self.event_type}"


class UsageRecord(BaseModel):
    class Metric(models.TextChoices):
        AI_TOKENS = "ai_tokens", "AI Tokens"
        API_CALLS = "api_calls", "API Calls"
        SEATS = "seats", "Seats"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="usage_records"
    )
    metric = models.CharField(max_length=32, choices=Metric.choices, db_index=True)
    quantity = models.PositiveIntegerField(default=0)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()

    class Meta:
        db_table = "billing_usage_record"
        ordering = ("-period_start",)
        indexes = [models.Index(fields=["organization", "metric"])]

    def __str__(self) -> str:
        return f"{self.metric}:{self.quantity}"


class PaymentRequest(BaseModel):
    """Manual MTN MoMo / Orange Money payment awaiting staff approval."""

    class Provider(models.TextChoices):
        MTN_MOMO = "mtn_momo", "MTN Mobile Money"
        ORANGE_MONEY = "orange_money", "Orange Money"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="payment_requests",
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="payment_requests")
    provider = models.CharField(max_length=32, choices=Provider.choices, db_index=True)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default="xaf")
    reference = models.CharField(max_length=64, unique=True, db_index=True)
    payer_phone = models.CharField(max_length=32, blank=True, default="")
    payer_name = models.CharField(max_length=128, blank=True, default="")
    transaction_id = models.CharField(max_length=128, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    rejection_reason = models.TextField(blank=True, default="")
    requested_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_requests",
    )
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_payment_requests",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment_requests",
    )

    class Meta:
        db_table = "billing_payment_request"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.reference}:{self.status}"

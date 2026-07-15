"""Billing application services."""

from __future__ import annotations

from datetime import timedelta
from uuid import UUID, uuid4

from django.utils import timezone

from apps.billing.application.dto import InvoiceDTO, PlanDTO, SubscriptionDTO, UsageDTO
from apps.billing.domain.exceptions import (
    CouponInvalidError,
    PlanNotFoundError,
)
from apps.billing.infrastructure.models import (
    Coupon,
    Invoice,
    PaymentEvent,
    Plan,
    Subscription,
    UsageRecord,
)
from apps.organizations.domain.entities import MembershipRole
from apps.organizations.domain.exceptions import InsufficientRoleError, NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from infrastructure.external.dodo import DodoPaymentsClient

DEFAULT_PLANS = [
    {
        "code": "starter",
        "name": "Starter",
        "amount_cents": 2900,
        "features": {"seats": 5, "ai_tokens": 100000},
    },
    {
        "code": "pro",
        "name": "Pro",
        "amount_cents": 9900,
        "features": {"seats": 25, "ai_tokens": 1000000},
    },
    {
        "code": "business",
        "name": "Business",
        "amount_cents": 29900,
        "features": {"seats": 100, "ai_tokens": 5000000},
    },
]


class BillingService:
    def __init__(
        self,
        membership_repository: AbstractMembershipRepository,
        dodo_client: DodoPaymentsClient | None = None,
    ) -> None:
        self._memberships = membership_repository
        self._dodo = dodo_client or DodoPaymentsClient()

    def seed_plans(self) -> None:
        for item in DEFAULT_PLANS:
            Plan.objects.update_or_create(
                code=item["code"],
                defaults={
                    "name": item["name"],
                    "amount_cents": item["amount_cents"],
                    "currency": "usd",
                    "interval": Plan.Interval.MONTH,
                    "trial_days": 14,
                    "features": item["features"],
                    "is_active": True,
                },
            )

    def list_plans(self) -> list[PlanDTO]:
        self.seed_plans()
        return [self._plan_dto(p) for p in Plan.objects.filter(is_active=True)]

    def get_subscription(self, actor_id: UUID, organization_id: UUID) -> SubscriptionDTO | None:
        self._require_member(actor_id, organization_id)
        sub = (
            Subscription.objects.filter(organization_id=organization_id)
            .exclude(status=Subscription.Status.CANCELLED)
            .select_related("plan")
            .order_by("-created_at")
            .first()
        )
        return self._subscription_dto(sub) if sub else None

    def checkout(
        self, actor_id: UUID, organization_id: UUID, plan_code: str, coupon: str | None = None
    ) -> dict:
        self._require_owner_or_admin(actor_id, organization_id)
        self.seed_plans()
        try:
            plan = Plan.objects.get(code=plan_code, is_active=True)
        except Plan.DoesNotExist as exc:
            raise PlanNotFoundError() from exc
        if coupon:
            self.validate_coupon(coupon)
        session = self._dodo.create_checkout(
            organization_id=str(organization_id),
            plan_code=plan.code,
            amount_cents=plan.amount_cents,
            currency=plan.currency,
            coupon=coupon,
        )
        now = timezone.now()
        sub = Subscription.objects.create(
            organization_id=organization_id,
            plan=plan,
            status=Subscription.Status.TRIALING if plan.trial_days else Subscription.Status.ACTIVE,
            dodo_subscription_id=session.id,
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
            trial_end=now + timedelta(days=plan.trial_days) if plan.trial_days else None,
        )
        return {
            "checkout_url": session.checkout_url,
            "session_id": session.id,
            "subscription_id": str(sub.id),
            "plan_code": plan.code,
            "stub": self._dodo.is_stub,
        }

    def portal(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_owner_or_admin(actor_id, organization_id)
        session = self._dodo.create_portal(organization_id=str(organization_id))
        return {"portal_url": session.portal_url, "stub": self._dodo.is_stub}

    def list_invoices(self, actor_id: UUID, organization_id: UUID) -> list[InvoiceDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._invoice_dto(i) for i in Invoice.objects.filter(organization_id=organization_id)
        ]

    def validate_coupon(self, code: str) -> dict:
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist as exc:
            raise CouponInvalidError() from exc
        now = timezone.now()
        if coupon.valid_until and coupon.valid_until < now:
            raise CouponInvalidError("Coupon expired.")
        if coupon.max_redemptions is not None and coupon.times_redeemed >= coupon.max_redemptions:
            raise CouponInvalidError("Coupon redemption limit reached.")
        return {
            "code": coupon.code,
            "percent_off": coupon.percent_off,
            "amount_off": coupon.amount_off,
            "valid": True,
        }

    def refund(
        self,
        actor_id: UUID,
        organization_id: UUID,
        invoice_id: UUID,
        amount_cents: int | None = None,
    ) -> dict:
        self._require_owner_or_admin(actor_id, organization_id)
        try:
            invoice = Invoice.objects.get(pk=invoice_id, organization_id=organization_id)
        except Invoice.DoesNotExist as exc:
            from apps.billing.domain.exceptions import InvoiceNotFoundError

            raise InvoiceNotFoundError() from exc
        result = self._dodo.refund(
            invoice_id=str(invoice.id), amount_cents=amount_cents or invoice.amount_cents
        )
        invoice.status = Invoice.Status.VOID
        invoice.save(update_fields=["status", "updated_at"])
        return result

    def usage(self, actor_id: UUID, organization_id: UUID) -> list[UsageDTO]:
        self._require_member(actor_id, organization_id)
        records = UsageRecord.objects.filter(organization_id=organization_id)
        if not records.exists():
            now = timezone.now()
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            UsageRecord.objects.create(
                organization_id=organization_id,
                metric=UsageRecord.Metric.AI_TOKENS,
                quantity=0,
                period_start=start,
                period_end=now,
            )
            records = UsageRecord.objects.filter(organization_id=organization_id)
        return [
            UsageDTO(
                metric=r.metric,
                quantity=r.quantity,
                period_start=r.period_start,
                period_end=r.period_end,
            )
            for r in records
        ]

    def handle_dodo_webhook(self, payload: dict, signature: str | None) -> dict:
        import json

        raw = json.dumps(payload).encode("utf-8")
        if not self._dodo.verify_webhook_signature(raw, signature):
            from apps.core.domain.exceptions import PermissionDeniedError

            raise PermissionDeniedError("Invalid webhook signature.")
        event = PaymentEvent.objects.create(
            provider="dodo",
            event_type=payload.get("type") or payload.get("event_type") or "unknown",
            payload=payload,
        )
        data = payload.get("data") or payload
        org_id = data.get("organization_id")
        sub_id = data.get("dodo_subscription_id") or data.get("subscription_id")
        if org_id and sub_id:
            sub = (
                Subscription.objects.filter(organization_id=org_id, dodo_subscription_id=sub_id)
                .select_related("plan")
                .first()
            )
            if sub:
                status = data.get("status")
                if status in {s.value for s in Subscription.Status}:
                    sub.status = status
                    sub.save(update_fields=["status", "updated_at"])
                if data.get("create_invoice"):
                    Invoice.objects.create(
                        organization_id=sub.organization_id,
                        subscription=sub,
                        number=f"INV-{uuid4().hex[:10].upper()}",
                        amount_cents=sub.plan.amount_cents,
                        tax_cents=0,
                        status=Invoice.Status.PAID if status == "active" else Invoice.Status.OPEN,
                        hosted_url=f"https://novixa.ai/invoices/stub/{uuid4().hex[:8]}",
                        issued_at=timezone.now(),
                        paid_at=timezone.now() if status == "active" else None,
                    )
        event.processed_at = timezone.now()
        event.save(update_fields=["processed_at", "updated_at"])
        return {"received": True, "event_id": str(event.id)}

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _require_owner_or_admin(self, user_id: UUID, organization_id: UUID) -> None:
        membership = self._memberships.get(user_id, organization_id)
        if membership is None:
            raise NotOrganizationMemberError()
        if membership.role not in {MembershipRole.OWNER, MembershipRole.ADMIN}:
            raise InsufficientRoleError()

    @staticmethod
    def _plan_dto(p: Plan) -> PlanDTO:
        return PlanDTO(
            id=p.id,
            code=p.code,
            name=p.name,
            amount_cents=p.amount_cents,
            currency=p.currency,
            interval=p.interval,
            trial_days=p.trial_days,
            features=p.features or {},
            is_active=p.is_active,
        )

    @staticmethod
    def _subscription_dto(s: Subscription) -> SubscriptionDTO:
        return SubscriptionDTO(
            id=s.id,
            organization_id=s.organization_id,
            plan_id=s.plan_id,
            plan_code=s.plan.code,
            status=s.status,
            dodo_subscription_id=s.dodo_subscription_id,
            current_period_start=s.current_period_start,
            current_period_end=s.current_period_end,
            cancel_at_period_end=s.cancel_at_period_end,
            trial_end=s.trial_end,
            created_at=s.created_at,
        )

    @staticmethod
    def _invoice_dto(i: Invoice) -> InvoiceDTO:
        return InvoiceDTO(
            id=i.id,
            organization_id=i.organization_id,
            subscription_id=i.subscription_id,
            number=i.number,
            amount_cents=i.amount_cents,
            tax_cents=i.tax_cents,
            status=i.status,
            hosted_url=i.hosted_url,
            pdf_url=i.pdf_url,
            issued_at=i.issued_at,
            paid_at=i.paid_at,
        )

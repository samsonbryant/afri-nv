"""Billing application services."""

from __future__ import annotations

from datetime import timedelta
from uuid import UUID, uuid4

from django.utils import timezone

from apps.billing.application.dto import InvoiceDTO, PlanDTO, SubscriptionDTO, UsageDTO
from apps.billing.domain.exceptions import (
    CouponInvalidError,
    PaymentRequestInvalidError,
    PaymentRequestNotFoundError,
    PlanNotFoundError,
)
from apps.billing.infrastructure.models import (
    Coupon,
    Invoice,
    PaymentEvent,
    PaymentRequest,
    Plan,
    Subscription,
    UsageRecord,
)
from apps.organizations.domain.entities import MembershipRole
from apps.organizations.domain.exceptions import InsufficientRoleError, NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from apps.organizations.infrastructure.models import Organization
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

    def manual_payment_instructions(self) -> dict:
        from django.conf import settings

        return {
            "currency": getattr(settings, "MANUAL_PAYMENT_CURRENCY", "xaf"),
            "usd_to_local_rate": getattr(settings, "MANUAL_PAYMENT_USD_TO_LOCAL_RATE", 600),
            "providers": [
                {
                    "id": PaymentRequest.Provider.MTN_MOMO,
                    "name": "MTN Mobile Money",
                    "number": getattr(settings, "MTN_MOMO_NUMBER", "") or "",
                    "account_name": getattr(settings, "MTN_MOMO_ACCOUNT_NAME", "Novixa"),
                },
                {
                    "id": PaymentRequest.Provider.ORANGE_MONEY,
                    "name": "Orange Money",
                    "number": getattr(settings, "ORANGE_MONEY_NUMBER", "") or "",
                    "account_name": getattr(settings, "ORANGE_MONEY_ACCOUNT_NAME", "Novixa"),
                },
            ],
            "steps": [
                "Choose a plan and payment method (MTN MoMo or Orange Money).",
                "Send the exact amount to the merchant number shown, using the payment reference as the transfer note.",
                "Submit your payer phone number and MoMo/Orange transaction ID.",
                "A Novixa admin will verify the payment and activate your package.",
            ],
        }

    def create_manual_payment(
        self,
        actor_id: UUID,
        *,
        organization_id: UUID,
        plan_code: str,
        provider: str,
        payer_phone: str,
        payer_name: str = "",
        transaction_id: str = "",
        notes: str = "",
    ) -> dict:
        self._require_owner_or_admin(actor_id, organization_id)
        self.seed_plans()
        try:
            plan = Plan.objects.get(code=plan_code, is_active=True)
        except Plan.DoesNotExist as exc:
            raise PlanNotFoundError() from exc
        if provider not in {p.value for p in PaymentRequest.Provider}:
            raise PaymentRequestInvalidError("Unsupported payment provider.")

        from django.conf import settings

        rate = int(getattr(settings, "MANUAL_PAYMENT_USD_TO_LOCAL_RATE", 600) or 600)
        currency = getattr(settings, "MANUAL_PAYMENT_CURRENCY", "xaf")
        # Plans are stored in USD cents; convert to local currency major units * 100.
        local_amount_cents = round((plan.amount_cents / 100) * rate * 100)
        reference = f"NVX-{uuid4().hex[:8].upper()}"

        # Cancel older open requests for this org so only one is in flight.
        PaymentRequest.objects.filter(
            organization_id=organization_id,
            status__in=[PaymentRequest.Status.PENDING, PaymentRequest.Status.SUBMITTED],
        ).update(status=PaymentRequest.Status.CANCELLED)

        status = (
            PaymentRequest.Status.SUBMITTED
            if payer_phone.strip() and transaction_id.strip()
            else PaymentRequest.Status.PENDING
        )
        req = PaymentRequest.objects.create(
            organization_id=organization_id,
            plan=plan,
            provider=provider,
            status=status,
            amount_cents=local_amount_cents,
            currency=currency,
            reference=reference,
            payer_phone=payer_phone.strip(),
            payer_name=payer_name.strip(),
            transaction_id=transaction_id.strip(),
            notes=notes.strip(),
            requested_by_id=actor_id,
        )
        return self._payment_request_dict(req)

    def submit_manual_payment(
        self,
        actor_id: UUID,
        request_id: UUID,
        *,
        payer_phone: str,
        payer_name: str = "",
        transaction_id: str = "",
        notes: str = "",
    ) -> dict:
        try:
            req = PaymentRequest.objects.select_related("plan", "organization").get(pk=request_id)
        except PaymentRequest.DoesNotExist as exc:
            raise PaymentRequestNotFoundError() from exc
        self._require_owner_or_admin(actor_id, req.organization_id)
        if req.status not in {PaymentRequest.Status.PENDING, PaymentRequest.Status.SUBMITTED}:
            raise PaymentRequestInvalidError("Only pending payments can be updated.")
        if not payer_phone.strip() or not transaction_id.strip():
            raise PaymentRequestInvalidError("payer_phone and transaction_id are required.")
        req.payer_phone = payer_phone.strip()
        req.payer_name = payer_name.strip()
        req.transaction_id = transaction_id.strip()
        if notes.strip():
            req.notes = notes.strip()
        req.status = PaymentRequest.Status.SUBMITTED
        req.save(
            update_fields=[
                "payer_phone",
                "payer_name",
                "transaction_id",
                "notes",
                "status",
                "updated_at",
            ]
        )
        return self._payment_request_dict(req)

    def list_manual_payments(self, actor_id: UUID, organization_id: UUID) -> list[dict]:
        self._require_member(actor_id, organization_id)
        qs = PaymentRequest.objects.filter(organization_id=organization_id).select_related("plan")
        return [self._payment_request_dict(r) for r in qs[:100]]

    def list_all_manual_payments(self, *, status: str | None = None) -> list[dict]:
        qs = PaymentRequest.objects.select_related("plan", "organization", "requested_by").order_by(
            "-created_at"
        )
        if status:
            qs = qs.filter(status=status)
        return [self._payment_request_dict(r, include_org=True) for r in qs[:200]]

    def approve_manual_payment(self, admin_id: UUID, request_id: UUID) -> dict:
        try:
            req = PaymentRequest.objects.select_related("plan", "organization").get(pk=request_id)
        except PaymentRequest.DoesNotExist as exc:
            raise PaymentRequestNotFoundError() from exc
        if req.status not in {PaymentRequest.Status.PENDING, PaymentRequest.Status.SUBMITTED}:
            raise PaymentRequestInvalidError("Only pending/submitted payments can be approved.")

        now = timezone.now()
        # Cancel other active/trialing subs for this org.
        Subscription.objects.filter(organization_id=req.organization_id).exclude(
            status=Subscription.Status.CANCELLED
        ).update(status=Subscription.Status.CANCELLED)

        sub = Subscription.objects.create(
            organization_id=req.organization_id,
            plan=req.plan,
            status=Subscription.Status.ACTIVE,
            dodo_subscription_id="",
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
            trial_end=None,
        )
        Invoice.objects.create(
            organization_id=req.organization_id,
            subscription=sub,
            number=f"INV-MM-{uuid4().hex[:10].upper()}",
            amount_cents=req.amount_cents,
            tax_cents=0,
            status=Invoice.Status.PAID,
            hosted_url="",
            pdf_url="",
            issued_at=now,
            paid_at=now,
        )
        PaymentEvent.objects.create(
            provider=req.provider,
            event_type="payment.approved",
            payload={
                "payment_request_id": str(req.id),
                "reference": req.reference,
                "transaction_id": req.transaction_id,
                "organization_id": str(req.organization_id),
                "plan_code": req.plan.code,
                "approved_by": str(admin_id),
            },
            processed_at=now,
        )

        org_plan = {
            "starter": "starter",
            "pro": "pro",
            "business": "enterprise",
        }.get(req.plan.code, "starter")
        Organization.objects.filter(pk=req.organization_id).update(plan=org_plan)

        req.status = PaymentRequest.Status.APPROVED
        req.reviewed_by_id = admin_id
        req.reviewed_at = now
        req.subscription = sub
        req.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "subscription",
                "updated_at",
            ]
        )
        return self._payment_request_dict(req, include_org=True)

    def reject_manual_payment(self, admin_id: UUID, request_id: UUID, reason: str = "") -> dict:
        try:
            req = PaymentRequest.objects.select_related("plan", "organization").get(pk=request_id)
        except PaymentRequest.DoesNotExist as exc:
            raise PaymentRequestNotFoundError() from exc
        if req.status not in {PaymentRequest.Status.PENDING, PaymentRequest.Status.SUBMITTED}:
            raise PaymentRequestInvalidError("Only pending/submitted payments can be rejected.")
        req.status = PaymentRequest.Status.REJECTED
        req.rejection_reason = reason.strip()
        req.reviewed_by_id = admin_id
        req.reviewed_at = timezone.now()
        req.save(
            update_fields=[
                "status",
                "rejection_reason",
                "reviewed_by",
                "reviewed_at",
                "updated_at",
            ]
        )
        PaymentEvent.objects.create(
            provider=req.provider,
            event_type="payment.rejected",
            payload={
                "payment_request_id": str(req.id),
                "reference": req.reference,
                "reason": req.rejection_reason,
                "rejected_by": str(admin_id),
            },
            processed_at=timezone.now(),
        )
        return self._payment_request_dict(req, include_org=True)

    def _payment_request_dict(self, req: PaymentRequest, *, include_org: bool = False) -> dict:
        data = {
            "id": str(req.id),
            "organization_id": str(req.organization_id),
            "plan_code": req.plan.code,
            "plan_name": req.plan.name,
            "provider": req.provider,
            "status": req.status,
            "amount_cents": req.amount_cents,
            "currency": req.currency,
            "reference": req.reference,
            "payer_phone": req.payer_phone,
            "payer_name": req.payer_name,
            "transaction_id": req.transaction_id,
            "notes": req.notes,
            "rejection_reason": req.rejection_reason,
            "subscription_id": str(req.subscription_id) if req.subscription_id else None,
            "requested_by_id": str(req.requested_by_id) if req.requested_by_id else None,
            "reviewed_by_id": str(req.reviewed_by_id) if req.reviewed_by_id else None,
            "reviewed_at": req.reviewed_at,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
        }
        if include_org:
            data["organization_name"] = getattr(req.organization, "name", "")
            data["requested_by_email"] = getattr(req.requested_by, "email", "") or ""
        return data

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

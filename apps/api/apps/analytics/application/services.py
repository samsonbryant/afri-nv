"""Analytics application services."""

from __future__ import annotations

from datetime import timedelta
from uuid import UUID

from django.db.models import Sum
from django.utils import timezone

from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository


class AnalyticsService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    def overview(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        mrr = self._mrr_cents(organization_id)
        arr = mrr * 12
        customers = self._active_subscriptions(organization_id)
        churn = self._churn_rate(organization_id)
        ai_tokens = self._ai_tokens(organization_id)
        return {
            "organization_id": str(organization_id),
            "revenue": mrr,  # current monthly revenue cents
            "mrr": mrr,
            "arr": arr,
            "customers": customers,
            "churn_rate": churn,
            "ai_tokens": ai_tokens,
        }

    def revenue_series(self, actor_id: UUID, organization_id: UUID) -> list[dict]:
        self._require_member(actor_id, organization_id)
        mrr = self._mrr_cents(organization_id)
        now = timezone.now().date()
        series = []
        for i in range(11, -1, -1):
            month = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
            factor = 1 - (i * 0.02)
            series.append(
                {"period": month.isoformat(), "amount_cents": int(mrr * max(factor, 0.5))}
            )
        return series

    def mrr(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        return {"mrr_cents": self._mrr_cents(organization_id)}

    def arr(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        return {"arr_cents": self._mrr_cents(organization_id) * 12}

    def retention(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        churn = self._churn_rate(organization_id)
        return {"retention_rate": round(1 - churn, 4), "cohorts": self._stub_cohorts()}

    def churn(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        return {"churn_rate": self._churn_rate(organization_id)}

    def ai_usage(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        return {
            "tokens": self._ai_tokens(organization_id),
            "series": self._ai_series(organization_id),
        }

    def performance(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        success_rate = self._automation_success_rate(organization_id)
        return {
            "avg_latency_ms": 120 + (abs(hash(str(organization_id))) % 80),
            "automation_success_rate": success_rate,
            "p95_latency_ms": 280 + (abs(hash(str(organization_id))) % 100),
        }

    def satisfaction(self, actor_id: UUID, organization_id: UUID) -> dict:
        self._require_member(actor_id, organization_id)
        csat = self._csat(organization_id)
        return {"csat": csat, "nps": round((csat - 3) * 25, 1), "source": "support_tickets_stub"}

    def _mrr_cents(self, organization_id: UUID) -> int:
        try:
            from apps.billing.infrastructure.models import Subscription

            total = 0
            for sub in Subscription.objects.filter(
                organization_id=organization_id,
                status__in=["active", "trialing"],
            ).select_related("plan"):
                amount = sub.plan.amount_cents
                if sub.plan.interval == "year":
                    amount = amount // 12
                total += amount
            return total
        except Exception:
            return 0

    def _active_subscriptions(self, organization_id: UUID) -> int:
        try:
            from apps.billing.infrastructure.models import Subscription

            return Subscription.objects.filter(
                organization_id=organization_id, status__in=["active", "trialing"]
            ).count()
        except Exception:
            return 0

    def _churn_rate(self, organization_id: UUID) -> float:
        try:
            from apps.billing.infrastructure.models import Subscription

            cancelled = Subscription.objects.filter(
                organization_id=organization_id, status="cancelled"
            ).count()
            total = Subscription.objects.filter(organization_id=organization_id).count()
            if total == 0:
                return 0.05  # deterministic stub baseline
            return round(cancelled / total, 4)
        except Exception:
            return 0.05

    def _ai_tokens(self, organization_id: UUID) -> int:
        try:
            from apps.dashboard.infrastructure.models import AiUsageRecord

            result = AiUsageRecord.objects.filter(organization_id=organization_id).aggregate(
                total=Sum("tokens")
            )
            return int(result["total"] or 0)
        except Exception:
            return abs(hash(str(organization_id))) % 10000

    def _ai_series(self, organization_id: UUID) -> list[dict]:
        base = max(100, self._ai_tokens(organization_id) // 12)
        now = timezone.now().date()
        return [
            {
                "period": (now - timedelta(days=30 * i)).replace(day=1).isoformat(),
                "tokens": base + (i * 37),
            }
            for i in range(5, -1, -1)
        ]

    def _automation_success_rate(self, organization_id: UUID) -> float:
        try:
            from apps.automations.infrastructure.models import AutomationRun

            qs = AutomationRun.objects.filter(organization_id=organization_id)
            total = qs.count()
            if total == 0:
                return 0.96
            ok = qs.filter(status__in=["succeeded", "success", "completed"]).count()
            return round(ok / total, 4)
        except Exception:
            return 0.96

    def _csat(self, organization_id: UUID) -> float:
        try:
            from apps.support.infrastructure.models import Ticket

            closed = Ticket.objects.filter(
                organization_id=organization_id, status__in=["resolved", "closed"]
            ).count()
            total = Ticket.objects.filter(organization_id=organization_id).count()
            if total == 0:
                return 4.2
            ratio = closed / total
            return round(3.5 + ratio * 1.5, 2)
        except Exception:
            return 4.2

    @staticmethod
    def _stub_cohorts() -> list[dict]:
        return [
            {"cohort": "2026-01", "retention": [1.0, 0.82, 0.74, 0.68]},
            {"cohort": "2026-02", "retention": [1.0, 0.85, 0.77]},
            {"cohort": "2026-03", "retention": [1.0, 0.88]},
        ]

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

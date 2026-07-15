"""Platform admin services (staff-only)."""

from __future__ import annotations

from uuid import UUID

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum

from apps.organizations.infrastructure.models import Organization
from apps.platform_admin.domain.exceptions import (
    AdminUserNotFoundError,
    PlatformSettingNotFoundError,
)
from apps.platform_admin.infrastructure.models import PlatformSetting

User = get_user_model()


class PlatformAdminService:
    def list_users(self) -> list[dict]:
        return [
            {
                "id": str(u.id),
                "email": u.email,
                "is_active": u.is_active,
                "is_staff": u.is_staff,
                "date_joined": u.date_joined,
            }
            for u in User.objects.order_by("-date_joined")[:500]
        ]

    def get_user(self, user_id: UUID) -> dict:
        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist as exc:
            raise AdminUserNotFoundError() from exc
        return {
            "id": str(u.id),
            "email": u.email,
            "is_active": u.is_active,
            "is_staff": u.is_staff,
            "date_joined": u.date_joined,
        }

    def update_user(self, user_id: UUID, data: dict) -> dict:
        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist as exc:
            raise AdminUserNotFoundError() from exc
        if "is_active" in data:
            u.is_active = data["is_active"]
        if "is_staff" in data:
            u.is_staff = data["is_staff"]
        u.save()
        return self.get_user(user_id)

    def list_organizations(self) -> list[dict]:
        return [
            {
                "id": str(o.id),
                "name": o.name,
                "slug": o.slug,
                "plan": getattr(o, "plan", ""),
                "created_at": o.created_at,
            }
            for o in Organization.objects.order_by("-created_at")[:500]
        ]

    def list_subscriptions(self) -> list[dict]:
        from apps.billing.infrastructure.models import Subscription

        return [
            {
                "id": str(s.id),
                "organization_id": str(s.organization_id),
                "plan_code": s.plan.code,
                "status": s.status,
                "dodo_subscription_id": s.dodo_subscription_id,
            }
            for s in Subscription.objects.select_related("plan").order_by("-created_at")[:500]
        ]

    def list_payments(self) -> list[dict]:
        from apps.billing.infrastructure.models import PaymentEvent

        return [
            {
                "id": str(e.id),
                "provider": e.provider,
                "event_type": e.event_type,
                "processed_at": e.processed_at,
                "created_at": e.created_at,
            }
            for e in PaymentEvent.objects.order_by("-created_at")[:500]
        ]

    def analytics_overview(self) -> dict:
        from apps.billing.infrastructure.models import Invoice, Subscription
        from apps.dashboard.infrastructure.models import AiUsageRecord

        active_subs = Subscription.objects.filter(status__in=["active", "trialing"])
        mrr = 0
        for s in active_subs.select_related("plan"):
            amount = s.plan.amount_cents
            if s.plan.interval == "year":
                amount = amount // 12
            mrr += amount
        paid = Invoice.objects.filter(status="paid").aggregate(total=Sum("amount_cents"))
        ai_tokens = AiUsageRecord.objects.aggregate(total=Sum("tokens"))
        return {
            "users": User.objects.count(),
            "organizations": Organization.objects.count(),
            "active_subscriptions": active_subs.count(),
            "mrr_cents": mrr,
            "arr_cents": mrr * 12,
            "revenue_cents": paid["total"] or 0,
            "ai_tokens": ai_tokens["total"] or 0,
        }

    def ai_usage(self) -> list[dict]:
        from apps.dashboard.infrastructure.models import AiUsageRecord

        rows = (
            AiUsageRecord.objects.values("organization_id")
            .annotate(tokens=Sum("tokens"), calls=Count("id"))
            .order_by("-tokens")[:100]
        )
        return [
            {
                "organization_id": str(r["organization_id"]),
                "tokens_used": r["tokens"] or 0,
                "calls": r["calls"] or 0,
            }
            for r in rows
        ]

    def audit_logs(self) -> list[dict]:
        from apps.security.infrastructure.models import AuditLog

        return [
            {
                "id": str(a.id),
                "actor_id": str(a.actor_id) if a.actor_id else None,
                "organization_id": str(a.organization_id) if a.organization_id else None,
                "action": a.action,
                "resource_type": a.resource_type,
                "resource_id": a.resource_id,
                "created_at": a.created_at,
            }
            for a in AuditLog.objects.order_by("-created_at")[:200]
        ]

    def list_settings(self) -> list[dict]:
        if not PlatformSetting.objects.exists():
            PlatformSetting.objects.get_or_create(
                key="maintenance_mode",
                defaults={"value": {"enabled": False}, "description": "Global maintenance flag"},
            )
            PlatformSetting.objects.get_or_create(
                key="feature_flags",
                defaults={"value": {}, "description": "Platform feature flags"},
            )
        return [
            {
                "id": str(s.id),
                "key": s.key,
                "value": s.value,
                "description": s.description,
                "updated_at": s.updated_at,
            }
            for s in PlatformSetting.objects.all()
        ]

    def update_setting(self, key: str, value: dict, description: str | None = None) -> dict:
        try:
            setting = PlatformSetting.objects.get(key=key)
        except PlatformSetting.DoesNotExist as exc:
            raise PlatformSettingNotFoundError() from exc
        setting.value = value
        if description is not None:
            setting.description = description
        setting.save()
        return {
            "id": str(setting.id),
            "key": setting.key,
            "value": setting.value,
            "description": setting.description,
            "updated_at": setting.updated_at,
        }

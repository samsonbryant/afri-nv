"""Platform admin services (staff-only)."""

from __future__ import annotations

from uuid import UUID

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum

from apps.accounts.domain.exceptions import EmailAlreadyExistsError
from apps.organizations.infrastructure.models import Organization
from apps.platform_admin.domain.exceptions import (
    AdminUserNotFoundError,
    PlatformSettingNotFoundError,
)
from apps.platform_admin.infrastructure.models import PlatformSetting

User = get_user_model()


def _serialize_user(u) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "first_name": u.first_name or "",
        "last_name": u.last_name or "",
        "full_name": f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email,
        "is_active": u.is_active,
        "is_staff": u.is_staff,
        "is_superuser": u.is_superuser,
        "date_joined": u.date_joined,
        "last_login": u.last_login,
    }


class PlatformAdminService:
    def list_users(self) -> list[dict]:
        return [_serialize_user(u) for u in User.objects.order_by("-date_joined")[:500]]

    def get_user(self, user_id: UUID) -> dict:
        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist as exc:
            raise AdminUserNotFoundError() from exc
        return _serialize_user(u)

    def create_user(self, data: dict) -> dict:
        email = data["email"].lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise EmailAlreadyExistsError()
        u = User.objects.create_user(
            email=email,
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            is_staff=bool(data.get("is_staff", False)),
            is_superuser=bool(data.get("is_superuser", False)),
            is_active=bool(data.get("is_active", True)),
        )
        return _serialize_user(u)

    def update_user(self, user_id: UUID, data: dict) -> dict:
        try:
            u = User.objects.get(pk=user_id)
        except User.DoesNotExist as exc:
            raise AdminUserNotFoundError() from exc
        if "first_name" in data:
            u.first_name = data["first_name"]
        if "last_name" in data:
            u.last_name = data["last_name"]
        if "is_active" in data:
            u.is_active = data["is_active"]
        if "is_staff" in data:
            u.is_staff = data["is_staff"]
        if "is_superuser" in data:
            u.is_superuser = data["is_superuser"]
        if data.get("password"):
            u.set_password(data["password"])
        u.save()
        return self.get_user(user_id)

    def list_organizations(self) -> list[dict]:
        qs = Organization.objects.annotate(members_count=Count("memberships")).order_by(
            "-created_at"
        )[:500]
        return [
            {
                "id": str(o.id),
                "name": o.name,
                "slug": o.slug,
                "plan": getattr(o, "plan", ""),
                "members_count": getattr(o, "members_count", 0),
                "created_at": o.created_at,
            }
            for o in qs
        ]

    def list_subscriptions(self) -> list[dict]:
        from apps.billing.infrastructure.models import Subscription

        return [
            {
                "id": str(s.id),
                "organization_id": str(s.organization_id),
                "organization_name": getattr(s.organization, "name", ""),
                "plan_code": s.plan.code,
                "plan": getattr(s.plan, "name", None) or s.plan.code,
                "status": s.status,
                "mrr": (s.plan.amount_cents // 100)
                if s.plan.interval != "year"
                else (s.plan.amount_cents // 12 // 100),
                "dodo_subscription_id": s.dodo_subscription_id,
            }
            for s in Subscription.objects.select_related("plan", "organization").order_by(
                "-created_at"
            )[:500]
        ]

    def list_payments(self) -> list[dict]:
        from apps.billing.infrastructure.models import PaymentEvent

        return [
            {
                "id": str(e.id),
                "provider": e.provider,
                "event_type": e.event_type,
                "status": e.event_type,
                "organization_name": e.provider,
                "amount": 0,
                "currency": "USD",
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
            "staff_users": User.objects.filter(is_staff=True).count(),
            "mrr_cents": mrr,
            "arr_cents": mrr * 12,
            "revenue_cents": paid["total"] or 0,
            "ai_tokens": ai_tokens["total"] or 0,
        }

    def ai_usage(self) -> list[dict]:
        from apps.dashboard.infrastructure.models import AiUsageRecord

        rows = list(
            AiUsageRecord.objects.values("organization_id")
            .annotate(tokens=Sum("tokens"), calls=Count("id"))
            .order_by("-tokens")[:100]
        )
        org_ids = [r["organization_id"] for r in rows]
        names = {
            str(o.id): o.name
            for o in Organization.objects.filter(id__in=org_ids).only("id", "name")
        }
        return [
            {
                "id": str(r["organization_id"]),
                "organization_id": str(r["organization_id"]),
                "organization_name": names.get(str(r["organization_id"]), "Organization"),
                "tokens": r["tokens"] or 0,
                "tokens_used": r["tokens"] or 0,
                "requests": r["calls"] or 0,
                "calls": r["calls"] or 0,
                "cost": 0,
                "period": "all-time",
            }
            for r in rows
        ]

    def audit_logs(self) -> list[dict]:
        from apps.security.infrastructure.models import AuditLog

        return [
            {
                "id": str(a.id),
                "actor_id": str(a.actor_id) if a.actor_id else None,
                "actor": str(a.actor_id) if a.actor_id else "system",
                "organization_id": str(a.organization_id) if a.organization_id else None,
                "action": a.action,
                "target": a.resource_id or a.resource_type or "—",
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
                key="signup_enabled",
                defaults={"value": {"enabled": True}, "description": "Allow public registration"},
            )
            PlatformSetting.objects.get_or_create(
                key="default_plan",
                defaults={"value": {"plan": "starter"}, "description": "Default billing plan"},
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

    def settings_summary(self) -> dict:
        settings = {s["key"]: s["value"] for s in self.list_settings()}
        maintenance = settings.get("maintenance_mode", {})
        signup = settings.get("signup_enabled", {})
        default_plan = settings.get("default_plan", {})
        return {
            "maintenance_mode": bool(
                maintenance.get("enabled") if isinstance(maintenance, dict) else maintenance
            ),
            "signup_enabled": bool(
                signup.get("enabled", True) if isinstance(signup, dict) else signup
            ),
            "default_plan": (
                default_plan.get("plan", "starter")
                if isinstance(default_plan, dict)
                else str(default_plan or "starter")
            ),
            "settings": self.list_settings(),
        }

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

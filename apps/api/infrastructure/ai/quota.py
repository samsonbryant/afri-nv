"""Free-tier AI request limits and upgrade prompts."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from django.conf import settings
from django.utils import timezone

FREE_PLAN_CODES = frozenset({"free", ""})


@dataclass(frozen=True, slots=True)
class FreeTierDecision:
    is_free: bool
    allowed: bool
    used: int
    limit: int
    remaining: int
    upgrade_url: str
    max_tokens: int


def free_ai_request_limit() -> int:
    return max(1, int(getattr(settings, "FREE_AI_REQUEST_LIMIT", 5) or 5))


def free_ai_max_tokens() -> int:
    return max(64, int(getattr(settings, "FREE_AI_MAX_TOKENS", 180) or 180))


def upgrade_url() -> str:
    base = (getattr(settings, "FRONTEND_URL", "") or "http://localhost:3000").rstrip("/")
    return f"{base}/billing"


def _month_start(now: datetime | None = None) -> datetime:
    current = now or timezone.now()
    return current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def organization_plan(organization_id: UUID | str | None) -> str:
    if not organization_id:
        return "free"
    from apps.organizations.infrastructure.models import Organization

    try:
        org = Organization.objects.only("plan").get(pk=organization_id)
    except Organization.DoesNotExist:
        return "free"
    return (org.plan or "free").strip().lower()


def is_free_plan(plan: str | None) -> bool:
    return (plan or "free").strip().lower() in FREE_PLAN_CODES


def count_ai_requests(organization_id: UUID | str, *, since: datetime | None = None) -> int:
    from apps.dashboard.infrastructure.models import AiUsageRecord

    qs = AiUsageRecord.objects.filter(organization_id=organization_id)
    if since is not None:
        qs = qs.filter(created_at__gte=since)
    return qs.count()


def evaluate_free_tier(organization_id: UUID | str | None) -> FreeTierDecision:
    limit = free_ai_request_limit()
    url = upgrade_url()
    if not organization_id:
        return FreeTierDecision(
            is_free=True,
            allowed=True,
            used=0,
            limit=limit,
            remaining=limit,
            upgrade_url=url,
            max_tokens=free_ai_max_tokens(),
        )

    plan = organization_plan(organization_id)
    free = is_free_plan(plan)
    used = count_ai_requests(organization_id, since=_month_start()) if free else 0
    remaining = max(0, limit - used) if free else limit
    paid_max = int(getattr(settings, "AI_MAX_TOKENS", 1024) or 1024)
    return FreeTierDecision(
        is_free=free,
        allowed=(not free) or used < limit,
        used=used,
        limit=limit,
        remaining=remaining,
        upgrade_url=url,
        max_tokens=free_ai_max_tokens() if free else paid_max,
    )


def upgrade_footer(*, remaining: int | None = None, blocked: bool = False) -> str:
    url = upgrade_url()
    if blocked:
        return (
            f"\n\n---\n"
            f"**Free plan limit reached.** Upgrade to unlock full AI replies, workflows, and "
            f"automations: [{url}]({url})"
        )
    left = (
        f" ({remaining} free AI request{'s' if remaining != 1 else ''} left this month)"
        if remaining is not None
        else ""
    )
    return (
        f"\n\n---\n*Free plan{left}. Upgrade for longer answers and unlimited AI:* [{url}]({url})"
    )


def blocked_upgrade_reply(user_content: str = "") -> str:
    preview = user_content.strip()[:120]
    asked = f'\n\n> You asked: "{preview}"' if preview else ""
    return (
        f"**Free plan limit reached.** You've used your free AI requests for this month."
        f"{asked}\n\n"
        f"Upgrade to keep chatting with full Novixa AI:\n"
        f"{upgrade_url()}"
    )


def minimize_free_reply(text: str, *, remaining: int | None = None) -> str:
    """Keep free-tier answers short and always end with an upgrade CTA."""
    cleaned = (text or "").strip()
    if len(cleaned) > 420:
        cleaned = cleaned[:400].rstrip() + "…"
    # Prefer first paragraph for brevity
    parts = [p.strip() for p in cleaned.split("\n\n") if p.strip()]
    if len(parts) > 2:
        cleaned = "\n\n".join(parts[:2])
        if not cleaned.endswith("…"):
            cleaned += "…"
    return f"{cleaned}{upgrade_footer(remaining=remaining)}"


def record_ai_usage(
    organization_id: UUID | str,
    *,
    tokens: int = 0,
    feature: str = "assistant",
    model: str | None = None,
) -> None:
    from apps.dashboard.infrastructure.models import AiUsageRecord

    AiUsageRecord.objects.create(
        organization_id=organization_id,
        tokens=max(0, int(tokens or 0)),
        model=model or getattr(settings, "AI_DEFAULT_MODEL", "gpt-4o-mini"),
        feature=feature,
    )


def resolve_completion_max_tokens(organization_id: UUID | str | None = None, **_: Any) -> int:
    decision = evaluate_free_tier(organization_id)
    return decision.max_tokens

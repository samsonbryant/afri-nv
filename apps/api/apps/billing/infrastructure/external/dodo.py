"""Dodo Payments client stub."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from django.conf import settings


@dataclass(slots=True)
class CheckoutSession:
    id: str
    checkout_url: str
    plan_code: str


@dataclass(slots=True)
class PortalSession:
    url: str


class DodoPaymentsClient:
    """Soft stub when DODO_API_KEY is missing; otherwise returns stub URLs shaped like live."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else getattr(settings, "DODO_API_KEY", "")
        self.is_stub = not bool(self.api_key)

    def create_checkout(
        self, *, organization_id: str, plan_code: str, coupon: str | None = None
    ) -> CheckoutSession:
        session_id = f"dodo_cs_{uuid4().hex[:16]}"
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        q = f"session={session_id}&plan={plan_code}&org={organization_id}"
        if coupon:
            q += f"&coupon={coupon}"
        return CheckoutSession(
            id=session_id,
            checkout_url=f"{base}/billing/checkout?{q}",
            plan_code=plan_code,
        )

    def create_portal(self, *, organization_id: str) -> PortalSession:
        base = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        return PortalSession(url=f"{base}/billing/portal?org={organization_id}")

    def verify_webhook_signature(self, payload: bytes, signature: str | None) -> bool:
        # Soft stub: accept when no secret configured or signature equals stub.
        secret = getattr(settings, "DODO_WEBHOOK_SECRET", "")
        if not secret:
            return True
        if not signature:
            return False
        return signature == secret or signature.startswith("stub_")

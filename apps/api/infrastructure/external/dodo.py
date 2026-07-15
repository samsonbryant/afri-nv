"""Dodo Payments client stub."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import uuid4

from django.conf import settings


@dataclass(slots=True)
class CheckoutSession:
    id: str
    checkout_url: str
    plan_code: str
    organization_id: str


@dataclass(slots=True)
class PortalSession:
    portal_url: str


class DodoPaymentsClient:
    """Soft stub when DODO_API_KEY is missing."""

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key if api_key is not None else getattr(settings, "DODO_API_KEY", "")
        self.is_stub = not bool(self.api_key)

    def create_checkout(
        self,
        *,
        organization_id: str,
        plan_code: str,
        amount_cents: int,
        currency: str = "usd",
        coupon: str | None = None,
        success_url: str | None = None,
        cancel_url: str | None = None,
    ) -> CheckoutSession:
        session_id = f"dodo_cs_{uuid4().hex[:16]}"
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        url = f"{frontend}/billing/checkout/{session_id}?plan={plan_code}&org={organization_id}" + (
            f"&coupon={coupon}" if coupon else ""
        )
        if not self.is_stub:
            # Real integration would call Dodo HTTP API here.
            url = f"https://checkout.dodopayments.com/session/{session_id}"
        return CheckoutSession(
            id=session_id,
            checkout_url=url,
            plan_code=plan_code,
            organization_id=organization_id,
        )

    def create_portal(
        self, *, organization_id: str, customer_id: str | None = None
    ) -> PortalSession:
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        if self.is_stub:
            return PortalSession(portal_url=f"{frontend}/billing/portal/{organization_id}")
        return PortalSession(
            portal_url=f"https://portal.dodopayments.com/{customer_id or organization_id}"
        )

    def verify_webhook_signature(self, payload: bytes, signature: str | None) -> bool:
        secret = getattr(settings, "DODO_WEBHOOK_SECRET", "")
        if not secret:
            return True  # stub mode accepts all
        if not signature:
            return False
        # Soft stub: accept when signature equals secret or "stub"
        return signature in {secret, f"sha256={secret}", "stub"}

    def refund(self, *, invoice_id: str, amount_cents: int | None = None) -> dict[str, Any]:
        return {
            "id": f"dodo_re_{uuid4().hex[:12]}",
            "invoice_id": invoice_id,
            "amount_cents": amount_cents,
            "status": "succeeded",
            "stub": self.is_stub,
        }

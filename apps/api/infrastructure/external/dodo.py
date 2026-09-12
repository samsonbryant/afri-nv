"""Dodo Payments client stub."""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import time
from dataclasses import dataclass
from typing import Any
from uuid import uuid4

import httpx
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
        self.stub_enabled = bool(getattr(settings, "BILLING_STUB_ENABLED", settings.DEBUG))

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
        customer_email: str = "",
        customer_name: str = "",
    ) -> CheckoutSession:
        if self.is_stub and not self.stub_enabled:
            raise RuntimeError("DODO_API_KEY is required when billing stubs are disabled.")
        session_id = f"dodo_cs_{uuid4().hex[:16]}"
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        url = f"{frontend}/billing/checkout/{session_id}?plan={plan_code}&org={organization_id}" + (
            f"&coupon={coupon}" if coupon else ""
        )
        if not self.is_stub:
            product_id = getattr(settings, f"DODO_PRODUCT_{plan_code.upper()}", "") or ""
            if not product_id:
                raise RuntimeError(f"DODO_PRODUCT_{plan_code.upper()} is required.")
            environment = getattr(settings, "DODO_ENVIRONMENT", "live_mode")
            endpoint = (
                "https://test.dodopayments.com/checkouts"
                if environment == "test_mode"
                else "https://live.dodopayments.com/checkouts"
            )
            return_url = success_url or (
                f"{frontend}/billing/checkout/dodo?plan={plan_code}&org={organization_id}"
            )
            payload: dict[str, Any] = {
                "product_cart": [{"product_id": product_id, "quantity": 1}],
                "return_url": return_url,
                "metadata": {
                    "organization_id": organization_id,
                    "plan_code": plan_code,
                },
            }
            if customer_email:
                payload["customer"] = {
                    "email": customer_email,
                    "name": customer_name or customer_email,
                }
            response = httpx.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=20,
            )
            response.raise_for_status()
            result = response.json()
            session_id = str(result["session_id"])
            url = str(result["checkout_url"])
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
            if not self.stub_enabled:
                raise RuntimeError("DODO_API_KEY is required when billing stubs are disabled.")
            return PortalSession(portal_url=f"{frontend}/billing/portal/{organization_id}")
        return PortalSession(
            portal_url=f"https://portal.dodopayments.com/{customer_id or organization_id}"
        )

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str | None,
        webhook_id: str | None = None,
        webhook_timestamp: str | None = None,
    ) -> bool:
        secret = getattr(settings, "DODO_WEBHOOK_SECRET", "")
        if not secret:
            return self.is_stub and self.stub_enabled
        if not signature or not webhook_id or not webhook_timestamp:
            return False
        try:
            timestamp = int(webhook_timestamp)
        except (ValueError, binascii.Error):
            return False
        if abs(int(time.time()) - timestamp) > 300:
            return False
        try:
            secret_bytes = (
                base64.b64decode(secret.removeprefix("whsec_"))
                if secret.startswith("whsec_")
                else secret.encode()
            )
        except ValueError:
            return False
        signed = f"{webhook_id}.{webhook_timestamp}.".encode() + payload
        expected = base64.b64encode(
            hmac.new(secret_bytes, signed, hashlib.sha256).digest()
        ).decode()
        candidates = [
            value.split(",", 1)[-1]
            for value in signature.replace(" ", ",").split(",")
            if value and value != "v1"
        ]
        return any(hmac.compare_digest(expected, candidate) for candidate in candidates)

    def refund(self, *, invoice_id: str, amount_cents: int | None = None) -> dict[str, Any]:
        return {
            "id": f"dodo_re_{uuid4().hex[:12]}",
            "invoice_id": invoice_id,
            "amount_cents": amount_cents,
            "status": "succeeded",
            "stub": self.is_stub,
        }

    def charge_off_session(
        self,
        *,
        organization_id: str,
        payment_method_ref: str,
        amount_cents: int,
        currency: str = "usd",
        description: str = "",
    ) -> dict[str, Any]:
        """Charge a saved card after trial. Stub succeeds when DODO_API_KEY is unset."""
        if self.is_stub and not self.stub_enabled:
            raise RuntimeError("DODO_API_KEY is required when billing stubs are disabled.")
        charge_id = f"dodo_ch_{uuid4().hex[:14]}"
        frontend = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        return {
            "id": charge_id,
            "organization_id": organization_id,
            "payment_method_ref": payment_method_ref,
            "amount_cents": amount_cents,
            "currency": currency,
            "description": description,
            "status": "succeeded",
            "receipt_url": f"{frontend}/billing/receipts/{charge_id}",
            "stub": self.is_stub,
        }

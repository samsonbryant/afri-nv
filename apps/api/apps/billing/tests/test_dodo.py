from __future__ import annotations

import base64
import hashlib
import hmac
import time

import httpx
import pytest
from django.test import override_settings

from infrastructure.external.dodo import DodoPaymentsClient


@override_settings(
    DODO_API_KEY="live-key",
    DODO_ENVIRONMENT="test_mode",
    DODO_PRODUCT_STARTER="pdt_starter",
)
def test_live_checkout_uses_hosted_dodo_api(monkeypatch: pytest.MonkeyPatch) -> None:
    request: dict = {}

    def fake_post(url: str, **kwargs):
        request.update(url=url, **kwargs)
        return httpx.Response(
            200,
            json={
                "session_id": "cks_live",
                "checkout_url": "https://checkout.dodopayments.com/cks_live",
            },
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx, "post", fake_post)
    session = DodoPaymentsClient().create_checkout(
        organization_id="org-1",
        plan_code="starter",
        amount_cents=4900,
        customer_email="owner@example.com",
    )

    assert session.id == "cks_live"
    assert request["url"] == "https://test.dodopayments.com/checkouts"
    assert request["json"]["product_cart"] == [{"product_id": "pdt_starter", "quantity": 1}]


@override_settings(DODO_API_KEY="live-key", DODO_WEBHOOK_SECRET="test-secret")
def test_webhook_signature_uses_standard_webhooks_format() -> None:
    payload = b'{"type":"payment.succeeded"}'
    timestamp = str(int(time.time()))
    webhook_id = "msg_123"
    expected = base64.b64encode(
        hmac.new(
            b"test-secret",
            f"{webhook_id}.{timestamp}.".encode() + payload,
            hashlib.sha256,
        ).digest()
    ).decode()

    assert DodoPaymentsClient().verify_webhook_signature(
        payload,
        f"v1,{expected}",
        webhook_id,
        timestamp,
    )

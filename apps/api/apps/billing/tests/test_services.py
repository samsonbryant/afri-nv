from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.billing.domain.exceptions import PaymentProviderUnavailableError
from apps.billing.infrastructure.dependencies import get_billing_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_billing_checkout() -> None:
    user, _ = get_auth_service().register(
        RegisterUserDTO(email="billing@novixa.ai", password="securepass123")
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Bill Org", slug="bill-org")
    )
    service = get_billing_service()
    plans = service.list_plans()
    assert any(p.code == "starter" for p in plans)
    result = service.checkout(user.id, org.id, "pro")
    assert "checkout_url" in result
    assert result["plan_code"] == "pro"
    sub = service.get_subscription(user.id, org.id)
    assert sub is not None
    assert sub.plan_code == "pro"


@pytest.mark.django_db
@pytest.mark.unit
def test_billing_checkout_translates_provider_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    user, _ = get_auth_service().register(
        RegisterUserDTO(email="provider-failure@novixa.ai", password="securepass123")
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Provider Failure", slug="provider-failure")
    )
    service = get_billing_service()

    def fail_checkout(**_kwargs):
        raise RuntimeError("provider credentials are missing")

    monkeypatch.setattr(service._dodo, "create_checkout", fail_checkout)

    with pytest.raises(PaymentProviderUnavailableError):
        service.checkout(user.id, org.id, "starter")


@pytest.mark.django_db
@pytest.mark.unit
def test_approved_mobile_payment_creates_payment_ready_subscription() -> None:
    user, _ = get_auth_service().register(
        RegisterUserDTO(email="mobile-payment@novixa.ai", password="securepass123")
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Mobile Payment", slug="mobile-payment")
    )
    service = get_billing_service()
    payment = service.create_manual_payment(
        user.id,
        org.id,
        "starter",
        "mtn_momo",
        payer_phone="0888123456",
        transaction_id="TXN-123456",
    )

    service.approve_manual_payment(user.id, payment["id"])

    subscription = service.get_subscription(user.id, org.id)
    assert subscription is not None
    assert subscription.status == "active"
    assert subscription.payment_method == "mtn_momo"
    assert subscription.auto_charge is False

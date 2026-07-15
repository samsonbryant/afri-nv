from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.billing.infrastructure.dependencies import get_billing_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_billing_checkout() -> None:
    user = (
        get_auth_service()
        .register(RegisterUserDTO(email="billing@novixa.ai", password="securepass123"))
        .user
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

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.analytics.infrastructure.dependencies import get_analytics_service
from apps.billing.infrastructure.dependencies import get_billing_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_analytics_overview() -> None:
    user = (
        get_auth_service()
        .register(RegisterUserDTO(email="analytics@novixa.ai", password="securepass123"))
        .user
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Analytics Org", slug="analytics-org")
    )
    get_billing_service().checkout(user.id, org.id, "starter")
    overview = get_analytics_service().overview(user.id, org.id)
    assert "mrr" in overview
    assert overview["mrr"] >= 0
    assert "churn_rate" in overview

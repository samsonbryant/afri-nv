"""Marketing service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.marketing.infrastructure.dependencies import get_marketing_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_marketing_generate_and_improve() -> None:
    auth = get_auth_service()
    user = auth.register(RegisterUserDTO(email="mkt@novixa.ai", password="securepass123")).user
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Mkt Org", slug="mkt-org")
    )
    service = get_marketing_service()
    asset = service.generate(
        user.id,
        org.id,
        asset_type="email",
        prompt="Launch week discount",
        tone="friendly",
        product_name="Novixa",
    )
    assert asset.type == "email"
    assert asset.content
    assert asset.status == "draft"

    improved = service.improve_asset(user.id, asset.id)
    assert improved.content
    assert improved.metadata.get("improved") is True

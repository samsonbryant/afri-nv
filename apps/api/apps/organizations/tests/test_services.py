"""Organization service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_create_organization_makes_owner() -> None:
    auth = get_auth_service()
    user, _ = auth.register(RegisterUserDTO(email="orgowner@novixa.ai", password="securepass123"))
    service = get_organization_service()
    org = service.create(
        user.id,
        CreateOrganizationDTO(name="Acme", slug="acme", plan="starter"),
    )
    assert org.slug == "acme"
    members = service.list_members(user.id, org.id)
    assert len(members) == 1
    assert members[0].role == "owner"

"""Developer service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.developer.infrastructure.dependencies import get_developer_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_webhook_create() -> None:
    user = (
        get_auth_service()
        .register(RegisterUserDTO(email="developer@novixa.ai", password="securepass123"))
        .user
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Dev Org", slug="dev-org")
    )
    service = get_developer_service()
    endpoint = service.create_webhook(
        user.id,
        org.id,
        {"url": "https://example.com/hooks/novixa", "events": ["meeting.created"]},
    )
    assert endpoint["url"].startswith("https://")
    assert endpoint["is_active"] is True
    deliveries = service.dispatch_event(org.id, "meeting.created", {"id": "1"})
    assert len(deliveries) == 1


@pytest.mark.django_db
@pytest.mark.unit
def test_api_key_create_authenticate_revoke() -> None:
    user = (
        get_auth_service()
        .register(RegisterUserDTO(email="apikey@novixa.ai", password="securepass123"))
        .user
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Key Org", slug="key-org")
    )
    service = get_developer_service()
    created = service.create_api_key(user.id, org.id, {"name": "CI"})
    assert created["key"].startswith("nvx_")
    assert service.authenticate_api_key(created["key"]) is not None
    service.delete_api_key(user.id, created["id"])
    assert service.authenticate_api_key(created["key"]) is None

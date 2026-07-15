"""Security service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service
from apps.security.infrastructure.dependencies import get_security_service
from infrastructure.security.crypto import decrypt_value, encrypt_value


@pytest.mark.django_db
@pytest.mark.unit
def test_security_audit_and_crypto() -> None:
    user = (
        get_auth_service()
        .register(RegisterUserDTO(email="security@novixa.ai", password="securepass123"))
        .user
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Sec Org", slug="sec-org")
    )
    service = get_security_service()
    service.log_event(
        action="login",
        actor_id=user.id,
        organization_id=org.id,
        resource_type="session",
    )
    logs = service.list_audit_logs(user.id, org.id)
    assert len(logs) >= 1
    assert encrypt_value("secret") != "secret"
    assert decrypt_value(encrypt_value("secret")) == "secret"
    status = service.status()
    assert status["encryption_enabled"] is True
    assert status["rate_limit"]["enabled"] is True

"""Platform admin service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.platform_admin.infrastructure.dependencies import get_platform_admin_service


@pytest.mark.django_db
@pytest.mark.unit
def test_platform_admin_settings() -> None:
    get_auth_service().register(RegisterUserDTO(email="padmin@novixa.ai", password="securepass123"))
    service = get_platform_admin_service()
    settings = service.list_settings()
    assert any(s["key"] == "maintenance_mode" for s in settings)
    updated = service.update_setting("maintenance_mode", {"enabled": True})
    assert updated["value"]["enabled"] is True

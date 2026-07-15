"""Core service unit tests."""

from __future__ import annotations

import pytest

from apps.core.application.services import HealthService


@pytest.mark.django_db
@pytest.mark.unit
def test_health_service_returns_ok() -> None:
    service = HealthService()
    result = service.check()
    assert result.status in {"ok", "degraded"}
    assert result.version == "1.0.0"
    assert "database" in result.checks
    assert "cache" in result.checks

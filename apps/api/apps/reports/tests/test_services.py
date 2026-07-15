"""Reports service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service
from apps.reports.infrastructure.dependencies import get_report_service


@pytest.mark.django_db
@pytest.mark.unit
def test_report_generate() -> None:
    auth = get_auth_service()
    user = auth.register(RegisterUserDTO(email="reports@novixa.ai", password="securepass123")).user
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Reports Org", slug="reports-org")
    )
    service = get_report_service()
    templates = service.templates()
    assert any(t["type"] == "sales" for t in templates)

    report = service.generate(user.id, org.id, report_type="sales")
    assert report.status == "ready"
    assert report.content.get("markdown")
    assert "metrics" in report.content

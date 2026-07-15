"""CRM service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.crm.infrastructure.dependencies import get_crm_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_crm_lead_convert_and_pipeline() -> None:
    auth = get_auth_service()
    user = auth.register(RegisterUserDTO(email="crm@novixa.ai", password="securepass123")).user
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="CRM Org", slug="crm-org")
    )
    service = get_crm_service()
    company = service.create_company(user.id, org.id, {"name": "Acme Corp", "domain": "acme.test"})
    lead = service.create_lead(
        user.id,
        org.id,
        {"title": "Acme inbound", "company_id": company.id, "source": "web"},
    )
    opportunity = service.convert_lead(user.id, lead.id)
    assert opportunity.company_id == company.id
    assert "Opportunity" in opportunity.name

    pipeline = service.pipeline(user.id, org.id)
    assert any(pipeline.stages.values())

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.agents.infrastructure.dependencies import get_agent_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_agents_run() -> None:
    user = (
        get_auth_service()
        .register(RegisterUserDTO(email="agents@novixa.ai", password="securepass123"))
        .user
    )
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Agent Org", slug="agent-org")
    )
    service = get_agent_service()
    agents = service.list_agents(user.id, org.id)
    assert len(agents) >= 8
    sales = next(a for a in agents if a.type == "sales")
    run = service.run_agent(user.id, sales.id, "Help me close Acme", {"deal": "Acme"})
    assert run.status == "succeeded"
    assert "Sales" in run.output or "sales" in run.output.lower()
    assert run.tokens_used > 0

"""Workflow service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service
from apps.workflows.application.dto import CreateWorkflowDTO
from apps.workflows.infrastructure.dependencies import get_workflow_service


@pytest.mark.django_db
@pytest.mark.unit
def test_create_workflow() -> None:
    auth = get_auth_service()
    user, _ = auth.register(RegisterUserDTO(email="wf@novixa.ai", password="securepass123"))
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="WF Org", slug="wf-org")
    )
    service = get_workflow_service()
    workflow = service.create(
        user.id,
        CreateWorkflowDTO(
            organization_id=org.id,
            name="Onboard Customer",
            description="Welcome flow",
            definition={"steps": [{"type": "email"}]},
            status="active",
        ),
    )
    assert workflow.name == "Onboard Customer"
    assert workflow.status == "active"
    listed = service.list_for_organization(user.id, org.id)
    assert len(listed) == 1

"""Automation service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.automations.application.dto import TriggerAutomationDTO
from apps.automations.infrastructure.dependencies import get_automation_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service
from apps.workflows.application.dto import CreateWorkflowDTO
from apps.workflows.infrastructure.dependencies import get_workflow_service


@pytest.mark.django_db
@pytest.mark.unit
def test_trigger_automation_run() -> None:
    auth = get_auth_service()
    user, _ = auth.register(RegisterUserDTO(email="auto@novixa.ai", password="securepass123"))
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Auto Org", slug="auto-org")
    )
    workflow = get_workflow_service().create(
        user.id,
        CreateWorkflowDTO(
            organization_id=org.id,
            name="Daily Report",
            definition={"steps": []},
            status="active",
        ),
    )
    service = get_automation_service()
    run = service.trigger(
        user.id,
        TriggerAutomationDTO(
            workflow_id=workflow.id,
            input_payload={"date": "2026-07-12"},
        ),
    )
    # Eager Celery should have executed the run
    refreshed = service.get_run(user.id, run.id)
    assert refreshed.status == "succeeded"
    assert refreshed.output_payload.get("processed") is True

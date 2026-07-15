"""Automations dependency injection."""

from __future__ import annotations

from apps.automations.application.services import AutomationService
from apps.automations.infrastructure.repositories import DjangoAutomationRunRepository
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from apps.workflows.infrastructure.repositories import DjangoWorkflowRepository


def get_automation_run_repository() -> DjangoAutomationRunRepository:
    return DjangoAutomationRunRepository()


def get_automation_service() -> AutomationService:
    return AutomationService(
        run_repository=get_automation_run_repository(),
        workflow_repository=DjangoWorkflowRepository(),
        membership_repository=DjangoMembershipRepository(),
    )

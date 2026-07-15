"""Workflows dependency injection."""

from __future__ import annotations

from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from apps.workflows.application.services import WorkflowService
from apps.workflows.infrastructure.repositories import DjangoWorkflowRepository


def get_workflow_repository() -> DjangoWorkflowRepository:
    return DjangoWorkflowRepository()


def get_workflow_service() -> WorkflowService:
    return WorkflowService(
        workflow_repository=get_workflow_repository(),
        membership_repository=DjangoMembershipRepository(),
    )

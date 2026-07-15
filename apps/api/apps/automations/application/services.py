"""Automation application services."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from apps.automations.application.dto import AutomationRunDTO, TriggerAutomationDTO
from apps.automations.domain.entities import AutomationRunEntity, AutomationRunStatus
from apps.automations.domain.exceptions import (
    AutomationRunNotFoundError,
    WorkflowNotTriggerableError,
)
from apps.automations.domain.repositories import AbstractAutomationRunRepository
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from apps.workflows.domain.entities import WorkflowStatus
from apps.workflows.domain.exceptions import WorkflowNotFoundError
from apps.workflows.domain.repositories import AbstractWorkflowRepository


class AutomationService:
    def __init__(
        self,
        run_repository: AbstractAutomationRunRepository,
        workflow_repository: AbstractWorkflowRepository,
        membership_repository: AbstractMembershipRepository,
    ) -> None:
        self._runs = run_repository
        self._workflows = workflow_repository
        self._memberships = membership_repository

    def list_runs(
        self,
        actor_id: UUID,
        organization_id: UUID,
        *,
        workflow_id: UUID | None = None,
    ) -> list[AutomationRunDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._to_dto(r)
            for r in self._runs.list_for_organization(organization_id, workflow_id=workflow_id)
        ]

    def get_run(self, actor_id: UUID, run_id: UUID) -> AutomationRunDTO:
        run = self._runs.get_by_id(run_id)
        if run is None:
            raise AutomationRunNotFoundError()
        self._require_member(actor_id, run.organization_id)
        return self._to_dto(run)

    def trigger(self, actor_id: UUID, data: TriggerAutomationDTO) -> AutomationRunDTO:
        workflow = self._workflows.get_by_id(data.workflow_id)
        if workflow is None:
            raise WorkflowNotFoundError()
        self._require_member(actor_id, workflow.organization_id)
        if workflow.status != WorkflowStatus.ACTIVE.value:
            raise WorkflowNotTriggerableError()

        run = self._runs.create(
            workflow_id=workflow.id,
            organization_id=workflow.organization_id,
            input_payload=data.input_payload,
            triggered_by_id=actor_id,
            status=AutomationRunStatus.PENDING.value,
        )

        from django.conf import settings
        from django.db import transaction

        from infrastructure.celery.tasks import run_automation_task

        run_id = str(run.id)
        if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
            # Same DB connection/transaction can see the uncommitted row
            return self.execute_run(run_id)

        transaction.on_commit(lambda: run_automation_task.delay(run_id))
        return self._to_dto(run)

    def execute_run(self, run_id: str | UUID) -> AutomationRunDTO:
        """Called by Celery worker to process a pending run."""
        run = self._runs.get_by_id(UUID(str(run_id)))
        if run is None:
            raise AutomationRunNotFoundError()

        run.status = AutomationRunStatus.RUNNING.value
        run.started_at = datetime.now(tz=UTC)
        self._runs.update(run)

        try:
            output = self._simulate_execution(run.input_payload)
            run.status = AutomationRunStatus.SUCCEEDED.value
            run.output_payload = output
            run.error_message = ""
        except Exception as exc:
            run.status = AutomationRunStatus.FAILED.value
            run.error_message = str(exc)
            run.output_payload = {}

        run.finished_at = datetime.now(tz=UTC)
        return self._to_dto(self._runs.update(run))

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    @staticmethod
    def _simulate_execution(payload: dict[str, Any]) -> dict[str, Any]:
        return {
            "processed": True,
            "echo": payload,
            "completed_at": datetime.now(tz=UTC).isoformat(),
        }

    @staticmethod
    def _to_dto(run: AutomationRunEntity) -> AutomationRunDTO:
        return AutomationRunDTO(
            id=run.id,
            workflow_id=run.workflow_id,
            organization_id=run.organization_id,
            status=run.status,
            input_payload=run.input_payload,
            output_payload=run.output_payload,
            error_message=run.error_message,
            triggered_by_id=run.triggered_by_id,
            started_at=run.started_at,
            finished_at=run.finished_at,
            created_at=run.created_at,
            updated_at=run.updated_at,
        )

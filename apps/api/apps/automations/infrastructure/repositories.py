"""Django automation run repository."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from apps.automations.domain.entities import AutomationRunEntity
from apps.automations.domain.repositories import AbstractAutomationRunRepository
from apps.automations.infrastructure.models import AutomationRun


class DjangoAutomationRunRepository(AbstractAutomationRunRepository):
    def get_by_id(self, run_id: UUID) -> AutomationRunEntity | None:
        try:
            run = AutomationRun.objects.get(pk=run_id)
        except AutomationRun.DoesNotExist:
            return None
        return self._to_entity(run)

    def list_for_organization(
        self, organization_id: UUID, *, workflow_id: UUID | None = None
    ) -> list[AutomationRunEntity]:
        qs = AutomationRun.objects.filter(organization_id=organization_id)
        if workflow_id is not None:
            qs = qs.filter(workflow_id=workflow_id)
        return [self._to_entity(r) for r in qs]

    def create(
        self,
        *,
        workflow_id: UUID,
        organization_id: UUID,
        input_payload: dict[str, Any],
        triggered_by_id: UUID | None,
        status: str,
    ) -> AutomationRunEntity:
        run = AutomationRun.objects.create(
            workflow_id=workflow_id,
            organization_id=organization_id,
            input_payload=input_payload,
            triggered_by_id=triggered_by_id,
            status=status,
        )
        return self._to_entity(run)

    def update(self, run: AutomationRunEntity) -> AutomationRunEntity:
        orm = AutomationRun.objects.get(pk=run.id)
        orm.status = run.status
        orm.input_payload = run.input_payload
        orm.output_payload = run.output_payload
        orm.error_message = run.error_message
        orm.started_at = run.started_at
        orm.finished_at = run.finished_at
        orm.save(
            update_fields=[
                "status",
                "input_payload",
                "output_payload",
                "error_message",
                "started_at",
                "finished_at",
                "updated_at",
            ]
        )
        return self._to_entity(orm)

    @staticmethod
    def _to_entity(run: AutomationRun) -> AutomationRunEntity:
        return AutomationRunEntity(
            id=run.id,
            workflow_id=run.workflow_id,
            organization_id=run.organization_id,
            status=run.status,
            input_payload=run.input_payload or {},
            output_payload=run.output_payload or {},
            error_message=run.error_message or "",
            triggered_by_id=run.triggered_by_id,
            started_at=run.started_at,
            finished_at=run.finished_at,
            created_at=run.created_at,
            updated_at=run.updated_at,
        )

"""Django workflow repository."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from apps.workflows.domain.entities import WorkflowEntity
from apps.workflows.domain.repositories import AbstractWorkflowRepository
from apps.workflows.infrastructure.models import Workflow


class DjangoWorkflowRepository(AbstractWorkflowRepository):
    def get_by_id(self, workflow_id: UUID) -> WorkflowEntity | None:
        try:
            workflow = Workflow.objects.get(pk=workflow_id)
        except Workflow.DoesNotExist:
            return None
        return self._to_entity(workflow)

    def list_for_organization(self, organization_id: UUID) -> list[WorkflowEntity]:
        qs = Workflow.objects.filter(organization_id=organization_id)
        return [self._to_entity(w) for w in qs]

    def create(
        self,
        *,
        organization_id: UUID,
        name: str,
        description: str,
        definition: dict[str, Any],
        status: str,
        created_by_id: UUID | None,
    ) -> WorkflowEntity:
        workflow = Workflow.objects.create(
            organization_id=organization_id,
            name=name,
            description=description,
            definition=definition,
            status=status,
            created_by_id=created_by_id,
        )
        return self._to_entity(workflow)

    def update(self, workflow: WorkflowEntity) -> WorkflowEntity:
        orm = Workflow.objects.get(pk=workflow.id)
        orm.name = workflow.name
        orm.description = workflow.description
        orm.definition = workflow.definition
        orm.status = workflow.status
        orm.save(update_fields=["name", "description", "definition", "status", "updated_at"])
        return self._to_entity(orm)

    def delete(self, workflow_id: UUID) -> None:
        Workflow.objects.filter(pk=workflow_id).delete()

    @staticmethod
    def _to_entity(workflow: Workflow) -> WorkflowEntity:
        return WorkflowEntity(
            id=workflow.id,
            organization_id=workflow.organization_id,
            name=workflow.name,
            description=workflow.description,
            definition=workflow.definition or {},
            status=workflow.status,
            created_by_id=workflow.created_by_id,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at,
        )

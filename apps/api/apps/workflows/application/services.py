"""Workflow application services."""

from __future__ import annotations

from uuid import UUID

from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from apps.workflows.application.dto import CreateWorkflowDTO, UpdateWorkflowDTO, WorkflowDTO
from apps.workflows.domain.entities import WorkflowEntity, WorkflowStatus
from apps.workflows.domain.exceptions import InvalidWorkflowDefinitionError, WorkflowNotFoundError
from apps.workflows.domain.repositories import AbstractWorkflowRepository


class WorkflowService:
    def __init__(
        self,
        workflow_repository: AbstractWorkflowRepository,
        membership_repository: AbstractMembershipRepository,
    ) -> None:
        self._workflows = workflow_repository
        self._memberships = membership_repository

    def create(self, actor_id: UUID, data: CreateWorkflowDTO) -> WorkflowDTO:
        self._require_member(actor_id, data.organization_id)
        if not isinstance(data.definition, dict):
            raise InvalidWorkflowDefinitionError()
        status = data.status if data.status in {s.value for s in WorkflowStatus} else "draft"
        workflow = self._workflows.create(
            organization_id=data.organization_id,
            name=data.name,
            description=data.description,
            definition=data.definition,
            status=status,
            created_by_id=actor_id,
        )
        return self._to_dto(workflow)

    def list_for_organization(self, actor_id: UUID, organization_id: UUID) -> list[WorkflowDTO]:
        self._require_member(actor_id, organization_id)
        return [self._to_dto(w) for w in self._workflows.list_for_organization(organization_id)]

    def get(self, actor_id: UUID, workflow_id: UUID) -> WorkflowDTO:
        workflow = self._get_or_404(workflow_id)
        self._require_member(actor_id, workflow.organization_id)
        return self._to_dto(workflow)

    def update(self, actor_id: UUID, workflow_id: UUID, data: UpdateWorkflowDTO) -> WorkflowDTO:
        workflow = self._get_or_404(workflow_id)
        self._require_member(actor_id, workflow.organization_id)
        if data.name is not None:
            workflow.name = data.name
        if data.description is not None:
            workflow.description = data.description
        if data.definition is not None:
            if not isinstance(data.definition, dict):
                raise InvalidWorkflowDefinitionError()
            workflow.definition = data.definition
        if data.status is not None:
            if data.status not in {s.value for s in WorkflowStatus}:
                raise InvalidWorkflowDefinitionError(f"Invalid status: {data.status}")
            workflow.status = data.status
        return self._to_dto(self._workflows.update(workflow))

    def delete(self, actor_id: UUID, workflow_id: UUID) -> None:
        workflow = self._get_or_404(workflow_id)
        self._require_member(actor_id, workflow.organization_id)
        self._workflows.delete(workflow_id)

    def _get_or_404(self, workflow_id: UUID) -> WorkflowEntity:
        workflow = self._workflows.get_by_id(workflow_id)
        if workflow is None:
            raise WorkflowNotFoundError()
        return workflow

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    @staticmethod
    def _to_dto(workflow: WorkflowEntity) -> WorkflowDTO:
        return WorkflowDTO(
            id=workflow.id,
            organization_id=workflow.organization_id,
            name=workflow.name,
            description=workflow.description,
            definition=workflow.definition,
            status=workflow.status,
            created_by_id=workflow.created_by_id,
            created_at=workflow.created_at,
            updated_at=workflow.updated_at,
        )

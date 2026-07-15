"""Workflow repository interfaces."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from apps.workflows.domain.entities import WorkflowEntity


class AbstractWorkflowRepository(ABC):
    @abstractmethod
    def get_by_id(self, workflow_id: UUID) -> WorkflowEntity | None: ...

    @abstractmethod
    def list_for_organization(self, organization_id: UUID) -> list[WorkflowEntity]: ...

    @abstractmethod
    def create(
        self,
        *,
        organization_id: UUID,
        name: str,
        description: str,
        definition: dict[str, Any],
        status: str,
        created_by_id: UUID | None,
    ) -> WorkflowEntity: ...

    @abstractmethod
    def update(self, workflow: WorkflowEntity) -> WorkflowEntity: ...

    @abstractmethod
    def delete(self, workflow_id: UUID) -> None: ...

"""Automation repository interfaces."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from apps.automations.domain.entities import AutomationRunEntity


class AbstractAutomationRunRepository(ABC):
    @abstractmethod
    def get_by_id(self, run_id: UUID) -> AutomationRunEntity | None: ...

    @abstractmethod
    def list_for_organization(
        self, organization_id: UUID, *, workflow_id: UUID | None = None
    ) -> list[AutomationRunEntity]: ...

    @abstractmethod
    def create(
        self,
        *,
        workflow_id: UUID,
        organization_id: UUID,
        input_payload: dict[str, Any],
        triggered_by_id: UUID | None,
        status: str,
    ) -> AutomationRunEntity: ...

    @abstractmethod
    def update(self, run: AutomationRunEntity) -> AutomationRunEntity: ...

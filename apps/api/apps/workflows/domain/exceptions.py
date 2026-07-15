"""Workflow domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class WorkflowNotFoundError(NotFoundError):
    default_message = "Workflow not found."
    code = "workflow_not_found"


class InvalidWorkflowDefinitionError(ValidationError):
    default_message = "Invalid workflow definition."
    code = "invalid_workflow_definition"

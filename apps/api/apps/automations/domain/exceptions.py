"""Automation domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class AutomationRunNotFoundError(NotFoundError):
    default_message = "Automation run not found."
    code = "automation_run_not_found"


class WorkflowNotTriggerableError(ValidationError):
    default_message = "Workflow cannot be triggered in its current status."
    code = "workflow_not_triggerable"

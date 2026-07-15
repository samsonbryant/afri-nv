from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError


class AgentNotFoundError(NotFoundError):
    default_message = "Agent not found."
    code = "agent_not_found"


class AgentRunNotFoundError(NotFoundError):
    default_message = "Agent run not found."
    code = "agent_run_not_found"

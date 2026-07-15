"""Workflow visual graph node type registry."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class NodeTypeSpec:
    id: str
    kind: str  # trigger | condition | action
    label: str
    description: str
    config_schema: dict[str, str]


NODE_TYPE_MAP: dict[str, NodeTypeSpec] = {
    "webhook": NodeTypeSpec(
        id="webhook",
        kind="trigger",
        label="Webhook Trigger",
        description="Start when an HTTP webhook is received.",
        config_schema={"path": "string", "method": "string"},
    ),
    "schedule": NodeTypeSpec(
        id="schedule",
        kind="trigger",
        label="Schedule Trigger",
        description="Start on a cron/interval schedule.",
        config_schema={"cron": "string"},
    ),
    "record_created": NodeTypeSpec(
        id="record_created",
        kind="trigger",
        label="Record Created",
        description="Start when a CRM/support record is created.",
        config_schema={"model": "string"},
    ),
    "if_else": NodeTypeSpec(
        id="if_else",
        kind="condition",
        label="If / Else",
        description="Branch based on an expression.",
        config_schema={"expression": "string"},
    ),
    "send_email": NodeTypeSpec(
        id="send_email",
        kind="action",
        label="Send Email",
        description="Send an email message.",
        config_schema={"to": "string", "subject": "string", "body": "string"},
    ),
    "create_task": NodeTypeSpec(
        id="create_task",
        kind="action",
        label="Create Task",
        description="Create a task for a user.",
        config_schema={"title": "string", "assignee_id": "string"},
    ),
    "http_request": NodeTypeSpec(
        id="http_request",
        kind="action",
        label="HTTP Request",
        description="Call an external HTTP endpoint.",
        config_schema={"url": "string", "method": "string"},
    ),
    "ai_generate": NodeTypeSpec(
        id="ai_generate",
        kind="action",
        label="AI Generate",
        description="Generate text with the AI engine.",
        config_schema={"prompt": "string"},
    ),
    "notify": NodeTypeSpec(
        id="notify",
        kind="action",
        label="Notify",
        description="Send an in-app notification.",
        config_schema={"message": "string", "user_id": "string"},
    ),
}


def list_node_types() -> list[dict[str, Any]]:
    return [
        {
            "id": spec.id,
            "type": spec.kind,
            "category": spec.kind,
            "label": spec.label,
            "description": spec.description,
            "config_schema": spec.config_schema,
        }
        for spec in NODE_TYPE_MAP.values()
    ]

"""Shared domain entities (pure dataclasses)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class HealthStatus:
    """Health check response entity."""

    status: str
    version: str
    timestamp: datetime
    checks: dict[str, str] = field(default_factory=dict)


@dataclass(slots=True)
class Identifiable:
    """Base identifiable entity."""

    id: UUID

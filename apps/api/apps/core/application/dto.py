"""Core application DTOs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class HealthCheckDTO:
    status: str
    version: str
    timestamp: datetime
    checks: dict[str, str] = field(default_factory=dict)

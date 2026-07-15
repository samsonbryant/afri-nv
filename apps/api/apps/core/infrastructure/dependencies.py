"""Dependency injection factories for core."""

from __future__ import annotations

from apps.core.application.services import HealthService


def get_health_service() -> HealthService:
    return HealthService()

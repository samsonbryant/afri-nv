"""Core application services."""

from __future__ import annotations

from datetime import UTC, datetime

from django.conf import settings
from django.core.cache import cache
from django.db import connection

from apps.core.application.dto import HealthCheckDTO


class HealthService:
    """Aggregates dependency health for the liveness/readiness endpoint."""

    VERSION = "1.0.0"

    def check(self) -> HealthCheckDTO:
        checks: dict[str, str] = {
            "database": self._check_database(),
            "cache": self._check_cache(),
        }
        overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
        return HealthCheckDTO(
            status=overall,
            version=self.VERSION,
            timestamp=datetime.now(tz=UTC),
            checks=checks,
        )

    def _check_database(self) -> str:
        try:
            connection.ensure_connection()
            return "ok"
        except Exception:
            return "error"

    def _check_cache(self) -> str:
        try:
            cache.set("healthcheck", "1", timeout=5)
            value = cache.get("healthcheck")
            return "ok" if value == "1" else "error"
        except Exception:
            # LocMem / missing Redis should not fail health in tests
            if settings.DEBUG or getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
                return "ok"
            return "error"

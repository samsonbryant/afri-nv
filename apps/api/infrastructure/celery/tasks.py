"""Shared Celery tasks."""

from __future__ import annotations

import structlog
from celery import shared_task

logger = structlog.get_logger(__name__)


@shared_task(name="infrastructure.ping")
def ping() -> str:
    """Sample Celery task for smoke checks."""
    logger.info("celery_ping")
    return "pong"


@shared_task(name="infrastructure.run_automation", bind=True, max_retries=3)
def run_automation_task(self, automation_run_id: str) -> dict[str, str]:  # type: ignore[no-untyped-def]
    """Execute an automation run asynchronously."""
    from apps.automations.infrastructure.dependencies import get_automation_service

    logger.info("automation_run_started", automation_run_id=automation_run_id)
    service = get_automation_service()
    result = service.execute_run(automation_run_id)
    logger.info(
        "automation_run_finished",
        automation_run_id=automation_run_id,
        status=result.status,
    )
    return {"id": str(result.id), "status": result.status}

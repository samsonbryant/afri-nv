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


@shared_task(name="infrastructure.process_document_job", bind=True, max_retries=3)
def process_document_job(self, job_id: str) -> dict[str, str]:  # type: ignore[no-untyped-def]
    from apps.documents.infrastructure.dependencies import get_document_studio_service

    logger.info("document_job_started", job_id=job_id)
    result = get_document_studio_service().process_job(job_id)
    logger.info("document_job_finished", job_id=job_id, status=result.status)
    return {"id": str(result.id), "status": result.status}


@shared_task(name="infrastructure.process_knowledge_document", bind=True, max_retries=3)
def process_knowledge_document(self, document_id: str) -> dict[str, str]:  # type: ignore[no-untyped-def]
    from apps.knowledge.infrastructure.dependencies import get_knowledge_service

    logger.info("knowledge_document_started", document_id=document_id)
    result = get_knowledge_service().process_document(document_id)
    logger.info("knowledge_document_finished", document_id=document_id, status=result.status)
    return {"id": str(result.id), "status": result.status}


@shared_task(name="infrastructure.process_report_generation", bind=True, max_retries=3)
def process_report_generation(self, report_id: str) -> dict[str, str]:  # type: ignore[no-untyped-def]
    from apps.reports.infrastructure.dependencies import get_report_service

    logger.info("report_generation_started", report_id=report_id)
    result = get_report_service().process_report(report_id)
    logger.info("report_generation_finished", report_id=report_id, status=result.status)
    return {"id": str(result.id), "status": result.status}


@shared_task(name="infrastructure.run_security_backup", bind=True, max_retries=2)
def run_security_backup(self, backup_id: str) -> dict[str, str]:  # type: ignore[no-untyped-def]
    from apps.security.infrastructure.dependencies import get_security_service

    logger.info("security_backup_started", backup_id=backup_id)
    result = get_security_service().complete_backup(backup_id)
    logger.info("security_backup_finished", backup_id=backup_id, status=result.get("status"))
    return {"id": str(result.get("id", backup_id)), "status": str(result.get("status", "unknown"))}

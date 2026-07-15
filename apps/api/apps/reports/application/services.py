"""Reports application services."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from apps.reports.application.dto import ReportDTO
from apps.reports.domain.entities import REPORT_TEMPLATES
from apps.reports.domain.exceptions import InvalidReportTypeError, ReportNotFoundError
from apps.reports.infrastructure.models import Report
from infrastructure.ai.llm import complete

logger = logging.getLogger("apps.reports")


class ReportService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    def list_reports(self, actor_id: UUID, organization_id: UUID) -> list[ReportDTO]:
        self._require_member(actor_id, organization_id)
        return [self._report_dto(r) for r in Report.objects.filter(organization_id=organization_id)]

    def get_report(self, actor_id: UUID, report_id: UUID) -> ReportDTO:
        report = self._get_report(report_id)
        self._require_member(actor_id, report.organization_id)
        return self._report_dto(report)

    def create_report(
        self,
        actor_id: UUID,
        organization_id: UUID,
        report_type: str,
        *,
        title: str = "",
        period_start: date | None = None,
        period_end: date | None = None,
    ) -> ReportDTO:
        return self.generate(
            actor_id,
            organization_id,
            report_type=report_type,
            title=title,
            period_start=period_start,
            period_end=period_end,
        )

    def generate(
        self,
        actor_id: UUID,
        organization_id: UUID,
        *,
        report_type: str,
        title: str = "",
        period_start: date | None = None,
        period_end: date | None = None,
    ) -> ReportDTO:
        self._require_member(actor_id, organization_id)
        if report_type not in Report.Type.values:
            raise InvalidReportTypeError(f"Unknown report type: {report_type}")

        today = timezone.now().date()
        if period_end is None:
            period_end = today
        if period_start is None:
            period_start = period_end - timedelta(days=30)

        report = Report.objects.create(
            organization_id=organization_id,
            type=report_type,
            title=title or f"{report_type.replace('_', ' ').title()} Report",
            period_start=period_start,
            period_end=period_end,
            status=Report.Status.PENDING,
            created_by_id=actor_id,
        )
        self._enqueue_generate(report.id)
        report.refresh_from_db()
        return self._report_dto(report)

    def templates(self) -> list[dict]:
        return list(REPORT_TEMPLATES)

    def process_report(self, report_id: str | UUID) -> ReportDTO:
        report = Report.objects.get(pk=report_id)
        report.status = Report.Status.GENERATING
        report.save(update_fields=["status", "updated_at"])
        try:
            metrics = self._collect_metrics(report)
            narrative = complete(
                f"Write a concise {report.type} report narrative for period "
                f"{report.period_start} to {report.period_end}.\n\n"
                f"Metrics:\n{metrics}\n\n"
                "Include highlights, risks, and recommended next steps in markdown.",
                system="You are a business intelligence analyst for Novixa.",
            )
            report.content = {
                "markdown": narrative,
                "metrics": metrics,
                "generated_at": timezone.now().isoformat(),
            }
            report.status = Report.Status.READY
            report.save(update_fields=["content", "status", "updated_at"])
        except Exception as exc:
            logger.exception("report_generation_failed", extra={"report_id": str(report_id)})
            report.status = Report.Status.FAILED
            report.content = {"error": str(exc)[:2000]}
            report.save(update_fields=["status", "content", "updated_at"])
        return self._report_dto(report)

    def _enqueue_generate(self, report_id: UUID) -> None:
        from infrastructure.celery.tasks import process_report_generation

        rid = str(report_id)
        if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
            self.process_report(rid)
            return
        transaction.on_commit(lambda: process_report_generation.delay(rid))

    def _collect_metrics(self, report: Report) -> dict:
        org_id = report.organization_id
        metrics: dict = {"organization_id": str(org_id), "type": report.type}

        try:
            from apps.crm.infrastructure.models import (
                Company,
                Contact,
                Lead,
                Opportunity,
            )

            metrics["crm"] = {
                "companies": Company.objects.filter(organization_id=org_id).count(),
                "contacts": Contact.objects.filter(organization_id=org_id).count(),
                "leads": Lead.objects.filter(organization_id=org_id).count(),
                "opportunities": Opportunity.objects.filter(organization_id=org_id).count(),
                "pipeline_amount": float(
                    sum(
                        (
                            o.amount
                            for o in Opportunity.objects.filter(organization_id=org_id)
                            if o.stage
                            not in (
                                Opportunity.Stage.CLOSED_WON,
                                Opportunity.Stage.CLOSED_LOST,
                            )
                        ),
                        Decimal("0"),
                    )
                ),
                "won_amount": float(
                    sum(
                        (
                            o.amount
                            for o in Opportunity.objects.filter(
                                organization_id=org_id,
                                stage=Opportunity.Stage.CLOSED_WON,
                            )
                        ),
                        Decimal("0"),
                    )
                ),
            }
        except Exception:
            metrics["crm"] = {"available": False}

        try:
            from apps.automations.infrastructure.models import AutomationRun
            from apps.workflows.infrastructure.models import Workflow

            metrics["automations"] = {
                "workflows": Workflow.objects.filter(organization_id=org_id).count(),
                "runs": AutomationRun.objects.filter(organization_id=org_id).count(),
            }
        except Exception:
            metrics["automations"] = {"available": False}

        try:
            from apps.marketing.infrastructure.models import Campaign, MarketingAsset

            metrics["marketing"] = {
                "assets": MarketingAsset.objects.filter(organization_id=org_id).count(),
                "campaigns": Campaign.objects.filter(organization_id=org_id).count(),
            }
        except Exception:
            metrics["marketing"] = {"available": False}

        try:
            from apps.support.infrastructure.models import Ticket

            qs = Ticket.objects.filter(organization_id=org_id)
            metrics["support"] = {
                "tickets": qs.count(),
                "open": qs.filter(status=Ticket.Status.OPEN).count(),
            }
        except Exception:
            metrics["support"] = {"available": False}

        try:
            from apps.dashboard.infrastructure.models import AiUsageRecord

            metrics["ai_usage"] = AiUsageRecord.objects.filter(organization_id=org_id).count()
        except Exception:
            metrics["ai_usage"] = 0

        return metrics

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_report(self, report_id: UUID) -> Report:
        try:
            return Report.objects.get(pk=report_id)
        except Report.DoesNotExist as exc:
            raise ReportNotFoundError() from exc

    @staticmethod
    def _report_dto(r: Report) -> ReportDTO:
        return ReportDTO(
            id=r.id,
            organization_id=r.organization_id,
            type=r.type,
            title=r.title,
            period_start=r.period_start,
            period_end=r.period_end,
            status=r.status,
            content=r.content or {},
            created_by_id=r.created_by_id,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )

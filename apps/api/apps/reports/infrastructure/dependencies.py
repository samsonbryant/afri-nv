"""Reports DI wiring."""

from __future__ import annotations

from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from apps.reports.application.services import ReportService


def get_report_service() -> ReportService:
    return ReportService(membership_repository=DjangoMembershipRepository())

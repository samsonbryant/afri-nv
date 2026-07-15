"""Reports domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class ReportNotFoundError(NotFoundError):
    default_message = "Report not found."
    code = "report_not_found"


class InvalidReportTypeError(ValidationError):
    default_message = "Invalid report type."
    code = "invalid_report_type"

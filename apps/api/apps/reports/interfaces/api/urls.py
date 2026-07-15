"""Reports API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.reports.interfaces.api.views import (
    GenerateReportView,
    ReportDetailView,
    ReportListCreateView,
    ReportTemplatesView,
)

app_name = "reports"

urlpatterns = [
    path("", ReportListCreateView.as_view(), name="list-create"),
    path("generate/", GenerateReportView.as_view(), name="generate"),
    path("templates/", ReportTemplatesView.as_view(), name="templates"),
    path("<uuid:report_id>/", ReportDetailView.as_view(), name="detail"),
]

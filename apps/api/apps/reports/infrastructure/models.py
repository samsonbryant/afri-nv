"""Reports ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class Report(BaseModel):
    class Type(models.TextChoices):
        FINANCIAL = "financial", "Financial"
        SALES = "sales", "Sales"
        HR = "hr", "HR"
        MARKETING = "marketing", "Marketing"
        INVENTORY = "inventory", "Inventory"
        EXECUTIVE = "executive", "Executive"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        ANNUAL = "annual", "Annual"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        GENERATING = "generating", "Generating"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="reports",
    )
    type = models.CharField(max_length=32, choices=Type.choices, db_index=True)
    title = models.CharField(max_length=255)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    content = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_reports",
    )

    class Meta:
        db_table = "reports_report"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "type", "status"])]

    def __str__(self) -> str:
        return self.title


class ReportSchedule(BaseModel):
    class Period(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        QUARTERLY = "quarterly", "Quarterly"
        ANNUAL = "annual", "Annual"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="report_schedules",
    )
    report_type = models.CharField(max_length=32, choices=Report.Type.choices)
    period = models.CharField(max_length=16, choices=Period.choices, default=Period.WEEKLY)
    cron_expression = models.CharField(max_length=64, blank=True, default="")
    is_active = models.BooleanField(default=True)
    last_run_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "reports_schedule"
        ordering = ("report_type",)

    def __str__(self) -> str:
        return f"{self.report_type}:{self.period}"

"""Reports domain entities."""

from __future__ import annotations

from enum import StrEnum


class ReportType(StrEnum):
    FINANCIAL = "financial"
    SALES = "sales"
    HR = "hr"
    MARKETING = "marketing"
    INVENTORY = "inventory"
    EXECUTIVE = "executive"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ANNUAL = "annual"


REPORT_TEMPLATES = [
    {"type": t.value, "label": t.name.replace("_", " ").title()} for t in ReportType
]

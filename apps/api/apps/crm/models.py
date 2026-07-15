"""Re-export CRM models."""

from __future__ import annotations

from apps.crm.infrastructure.models import (
    Company,
    Contact,
    CrmActivity,
    CrmNote,
    Lead,
    Opportunity,
)

__all__ = ["Company", "Contact", "CrmActivity", "CrmNote", "Lead", "Opportunity"]

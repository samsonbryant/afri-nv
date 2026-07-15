"""Re-export dashboard models."""

from __future__ import annotations

from apps.dashboard.infrastructure.models import AiUsageRecord, Notification

__all__ = ["AiUsageRecord", "Notification"]

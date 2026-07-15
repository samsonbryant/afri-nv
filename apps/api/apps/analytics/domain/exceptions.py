"""Analytics domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import ValidationError


class AnalyticsQueryError(ValidationError):
    default_message = "Invalid analytics query."
    code = "analytics_query_error"

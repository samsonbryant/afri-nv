"""Re-export User for Django AUTH_USER_MODEL discovery."""

from __future__ import annotations

from apps.accounts.infrastructure.models import User

__all__ = ["User"]

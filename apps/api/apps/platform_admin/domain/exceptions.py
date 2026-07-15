"""Platform admin exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError


class PlatformSettingNotFoundError(NotFoundError):
    default_message = "Platform setting not found."
    code = "platform_setting_not_found"


class AdminUserNotFoundError(NotFoundError):
    default_message = "User not found."
    code = "admin_user_not_found"

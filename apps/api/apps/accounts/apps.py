from __future__ import annotations

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    label = "accounts"
    verbose_name = "Accounts"

    def ready(self) -> None:
        # Import models so Django discovers them via models.py re-exports
        from apps.accounts.infrastructure import models as _models  # noqa: F401

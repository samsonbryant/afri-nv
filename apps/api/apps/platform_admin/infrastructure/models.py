"""Platform admin ORM models."""

from __future__ import annotations

from django.db import models

from infrastructure.persistence.base import BaseModel


class PlatformSetting(BaseModel):
    key = models.SlugField(max_length=128, unique=True)
    value = models.JSONField(default=dict, blank=True)
    description = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "platform_admin_setting"
        ordering = ("key",)

    def __str__(self) -> str:
        return self.key

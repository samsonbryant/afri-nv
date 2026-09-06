"""Organization ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class Organization(BaseModel):
    class Plan(models.TextChoices):
        FREE = "free", "Free"
        STARTER = "starter", "Starter"
        PRO = "pro", "Pro"
        ENTERPRISE = "enterprise", "Enterprise"

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    plan = models.CharField(
        max_length=32,
        choices=Plan.choices,
        default=Plan.FREE,
    )
    # Business profile used by AI agents, workflows, and automations.
    logo = models.ImageField(upload_to="org_logos/", blank=True, null=True)
    description = models.TextField(blank=True, default="")
    industry = models.CharField(max_length=128, blank=True, default="")
    website = models.URLField(blank=True, default="")
    phone = models.CharField(max_length=64, blank=True, default="")
    address = models.TextField(blank=True, default="")
    business_context = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "organizations_organization"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.name


class Membership(BaseModel):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.MEMBER)

    class Meta:
        db_table = "organizations_membership"
        unique_together = ("user", "organization")
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.user_id} @ {self.organization_id} ({self.role})"

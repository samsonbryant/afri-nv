"""Marketing ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class MarketingAsset(BaseModel):
    class Type(models.TextChoices):
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        LINKEDIN = "linkedin", "LinkedIn"
        TWITTER = "twitter", "Twitter"
        BLOG = "blog", "Blog"
        SEO = "seo", "SEO"
        EMAIL = "email", "Email"
        LANDING_PAGE = "landing_page", "Landing Page"
        PRODUCT_DESCRIPTION = "product_description", "Product Description"
        AD = "ad", "Ad"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="marketing_assets",
    )
    type = models.CharField(max_length=32, choices=Type.choices, db_index=True)
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_marketing_assets",
    )

    class Meta:
        db_table = "marketing_asset"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "type", "status"])]

    def __str__(self) -> str:
        return self.title


class Campaign(BaseModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SCHEDULED = "scheduled", "Scheduled"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="marketing_campaigns",
    )
    name = models.CharField(max_length=255)
    channel = models.CharField(max_length=64, blank=True, default="")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    asset = models.ForeignKey(
        MarketingAsset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="campaigns",
    )
    metrics = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "marketing_campaign"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self) -> str:
        return self.name

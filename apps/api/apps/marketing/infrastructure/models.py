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


class SocialConnection(BaseModel):
    """Connected social / messaging pages for the organization."""

    class Platform(models.TextChoices):
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        LINKEDIN = "linkedin", "LinkedIn"
        TWITTER = "twitter", "X / Twitter"
        TIKTOK = "tiktok", "TikTok"
        YOUTUBE = "youtube", "YouTube"
        WHATSAPP = "whatsapp", "WhatsApp"

    class Status(models.TextChoices):
        CONNECTED = "connected", "Connected"
        DISCONNECTED = "disconnected", "Disconnected"
        ERROR = "error", "Error"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="social_connections",
    )
    platform = models.CharField(max_length=32, choices=Platform.choices, db_index=True)
    account_name = models.CharField(max_length=255, blank=True, default="")
    account_id = models.CharField(max_length=128, blank=True, default="")
    access_token = models.TextField(blank=True, default="")
    refresh_token = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.CONNECTED, db_index=True
    )
    metadata = models.JSONField(default=dict, blank=True)
    connected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="social_connections",
    )

    class Meta:
        db_table = "marketing_social_connection"
        ordering = ("-created_at",)
        unique_together = ("organization", "platform", "account_id")

    def __str__(self) -> str:
        return f"{self.platform}:{self.account_name or self.account_id}"


class FacebookAdCampaign(BaseModel):
    """Facebook ads workspace: captions, schedule, targeting, performance."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SCHEDULED = "scheduled", "Scheduled"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="facebook_ad_campaigns",
    )
    connection = models.ForeignKey(
        SocialConnection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="facebook_ads",
    )
    name = models.CharField(max_length=255)
    caption_prompt = models.TextField(blank=True, default="")
    caption = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    automation_enabled = models.BooleanField(default=False)
    target_audience = models.JSONField(default=dict, blank=True)
    budget_cents = models.PositiveIntegerField(default=0)
    currency = models.CharField(max_length=8, default="usd")
    metrics = models.JSONField(default=dict, blank=True)  # reach, leads, progress, performance
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="facebook_ad_campaigns",
    )

    class Meta:
        db_table = "marketing_facebook_ad_campaign"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.name


class SocialPost(BaseModel):
    """Multi-platform content post published in real time across connected pages."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        QUEUED = "queued", "Queued"
        PUBLISHING = "publishing", "Publishing"
        PUBLISHED = "published", "Published"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="social_posts",
    )
    content = models.TextField()
    media_urls = models.JSONField(default=list, blank=True)
    platforms = models.JSONField(default=list, blank=True)  # list of platform keys
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    results = models.JSONField(default=dict, blank=True)  # per-platform publish status
    include_whatsapp = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="social_posts",
    )

    class Meta:
        db_table = "marketing_social_post"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"post:{self.status}:{self.id}"

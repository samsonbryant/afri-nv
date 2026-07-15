"""Marketing domain entities."""

from __future__ import annotations

from enum import StrEnum


class AssetType(StrEnum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    BLOG = "blog"
    SEO = "seo"
    EMAIL = "email"
    LANDING_PAGE = "landing_page"
    PRODUCT_DESCRIPTION = "product_description"
    AD = "ad"


class AssetStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

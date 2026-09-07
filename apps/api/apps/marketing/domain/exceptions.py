"""Marketing domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError


class AssetNotFoundError(NotFoundError):
    default_message = "Marketing asset not found."
    code = "asset_not_found"


class CampaignNotFoundError(NotFoundError):
    default_message = "Campaign not found."
    code = "campaign_not_found"


class SocialConnectionNotFoundError(NotFoundError):
    default_message = "Social connection not found."
    code = "social_connection_not_found"

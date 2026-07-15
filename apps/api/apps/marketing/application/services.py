"""Marketing application services."""

from __future__ import annotations

from uuid import UUID

from apps.marketing.application.dto import AssetDTO, CampaignDTO
from apps.marketing.domain.exceptions import AssetNotFoundError, CampaignNotFoundError
from apps.marketing.infrastructure.models import Campaign, MarketingAsset
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from infrastructure.ai.llm import complete

_TEMPLATES = {
    "facebook": "Write a Facebook post about {prompt}. Tone: {tone}. Product: {product}.",
    "instagram": "Write an Instagram caption about {prompt}. Tone: {tone}. Product: {product}. Include hashtags.",
    "linkedin": "Write a LinkedIn post about {prompt}. Tone: {tone}. Product: {product}.",
    "twitter": "Write a concise X/Twitter post about {prompt}. Tone: {tone}. Product: {product}.",
    "blog": "Write a blog outline and intro about {prompt}. Tone: {tone}. Product: {product}.",
    "seo": "Write SEO title tags and meta description for {prompt}. Product: {product}.",
    "email": "Write a marketing email about {prompt}. Tone: {tone}. Product: {product}.",
    "landing_page": "Write landing page hero + CTA copy for {prompt}. Tone: {tone}. Product: {product}.",
    "product_description": "Write a product description for {product}. Focus: {prompt}. Tone: {tone}.",
    "ad": "Write ad copy (headline + body + CTA) for {prompt}. Tone: {tone}. Product: {product}.",
}


class MarketingService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    def list_assets(self, actor_id: UUID, organization_id: UUID) -> list[AssetDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._asset_dto(a)
            for a in MarketingAsset.objects.filter(organization_id=organization_id)
        ]

    def create_asset(self, actor_id: UUID, organization_id: UUID, data: dict) -> AssetDTO:
        self._require_member(actor_id, organization_id)
        asset = MarketingAsset.objects.create(
            organization_id=organization_id,
            type=data["type"],
            title=data["title"],
            content=data.get("content", ""),
            status=data.get("status", MarketingAsset.Status.DRAFT),
            metadata=data.get("metadata") or {},
            created_by_id=actor_id,
        )
        return self._asset_dto(asset)

    def get_asset(self, actor_id: UUID, asset_id: UUID) -> AssetDTO:
        asset = self._get_asset(asset_id)
        self._require_member(actor_id, asset.organization_id)
        return self._asset_dto(asset)

    def update_asset(self, actor_id: UUID, asset_id: UUID, data: dict) -> AssetDTO:
        asset = self._get_asset(asset_id)
        self._require_member(actor_id, asset.organization_id)
        for key in ("type", "title", "content", "status", "metadata"):
            if key in data:
                setattr(asset, key, data[key])
        asset.save()
        return self._asset_dto(asset)

    def delete_asset(self, actor_id: UUID, asset_id: UUID) -> None:
        asset = self._get_asset(asset_id)
        self._require_member(actor_id, asset.organization_id)
        asset.delete()

    def generate(
        self,
        actor_id: UUID,
        organization_id: UUID,
        *,
        asset_type: str,
        prompt: str,
        tone: str = "professional",
        product_name: str = "",
    ) -> AssetDTO:
        self._require_member(actor_id, organization_id)
        template = _TEMPLATES.get(
            asset_type,
            "Write marketing content ({type}) for: {prompt}. Tone: {tone}. Product: {product}.",
        )
        content = complete(
            template.format(
                prompt=prompt,
                tone=tone or "professional",
                product=product_name or "the product",
                type=asset_type,
            ),
            system="You are a senior marketing copywriter for Novixa.",
        )
        title = f"{asset_type.replace('_', ' ').title()}: {prompt[:80]}"
        asset = MarketingAsset.objects.create(
            organization_id=organization_id,
            type=asset_type,
            title=title,
            content=content,
            status=MarketingAsset.Status.DRAFT,
            metadata={"prompt": prompt, "tone": tone, "product_name": product_name},
            created_by_id=actor_id,
        )
        return self._asset_dto(asset)

    def improve_asset(self, actor_id: UUID, asset_id: UUID) -> AssetDTO:
        asset = self._get_asset(asset_id)
        self._require_member(actor_id, asset.organization_id)
        improved = complete(
            f"Improve and rewrite this {asset.type} marketing content:\n\n{asset.content}",
            system="You are a senior marketing editor. Keep the intent, improve clarity and conversion.",
        )
        asset.content = improved
        meta = dict(asset.metadata or {})
        meta["improved"] = True
        asset.metadata = meta
        asset.save(update_fields=["content", "metadata", "updated_at"])
        return self._asset_dto(asset)

    def list_campaigns(self, actor_id: UUID, organization_id: UUID) -> list[CampaignDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._campaign_dto(c) for c in Campaign.objects.filter(organization_id=organization_id)
        ]

    def create_campaign(self, actor_id: UUID, organization_id: UUID, data: dict) -> CampaignDTO:
        self._require_member(actor_id, organization_id)
        campaign = Campaign.objects.create(
            organization_id=organization_id,
            name=data["name"],
            channel=data.get("channel", ""),
            status=data.get("status", Campaign.Status.DRAFT),
            scheduled_at=data.get("scheduled_at"),
            asset_id=data.get("asset_id"),
            metrics=data.get("metrics") or {},
        )
        return self._campaign_dto(campaign)

    def get_campaign(self, actor_id: UUID, campaign_id: UUID) -> CampaignDTO:
        campaign = self._get_campaign(campaign_id)
        self._require_member(actor_id, campaign.organization_id)
        return self._campaign_dto(campaign)

    def update_campaign(self, actor_id: UUID, campaign_id: UUID, data: dict) -> CampaignDTO:
        campaign = self._get_campaign(campaign_id)
        self._require_member(actor_id, campaign.organization_id)
        for key in ("name", "channel", "status", "scheduled_at", "asset_id", "metrics"):
            if key in data:
                setattr(campaign, key, data[key])
        campaign.save()
        return self._campaign_dto(campaign)

    def delete_campaign(self, actor_id: UUID, campaign_id: UUID) -> None:
        campaign = self._get_campaign(campaign_id)
        self._require_member(actor_id, campaign.organization_id)
        campaign.delete()

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_asset(self, asset_id: UUID) -> MarketingAsset:
        try:
            return MarketingAsset.objects.get(pk=asset_id)
        except MarketingAsset.DoesNotExist as exc:
            raise AssetNotFoundError() from exc

    def _get_campaign(self, campaign_id: UUID) -> Campaign:
        try:
            return Campaign.objects.get(pk=campaign_id)
        except Campaign.DoesNotExist as exc:
            raise CampaignNotFoundError() from exc

    @staticmethod
    def _asset_dto(a: MarketingAsset) -> AssetDTO:
        return AssetDTO(
            id=a.id,
            organization_id=a.organization_id,
            type=a.type,
            title=a.title,
            content=a.content,
            status=a.status,
            metadata=a.metadata or {},
            created_by_id=a.created_by_id,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )

    @staticmethod
    def _campaign_dto(c: Campaign) -> CampaignDTO:
        return CampaignDTO(
            id=c.id,
            organization_id=c.organization_id,
            name=c.name,
            channel=c.channel,
            status=c.status,
            scheduled_at=c.scheduled_at,
            asset_id=c.asset_id,
            metrics=c.metrics or {},
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

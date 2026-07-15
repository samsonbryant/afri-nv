"""Marketing serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.marketing.infrastructure.models import Campaign, MarketingAsset


class AssetWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=MarketingAsset.Type.choices)
    title = serializers.CharField(max_length=255)
    content = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(
        choices=MarketingAsset.Status.choices, required=False, default="draft"
    )
    metadata = serializers.DictField(required=False, default=dict)


class AssetUpdateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=MarketingAsset.Type.choices, required=False)
    title = serializers.CharField(max_length=255, required=False)
    content = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=MarketingAsset.Status.choices, required=False)
    metadata = serializers.DictField(required=False)


class AssetSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    type = serializers.CharField()
    title = serializers.CharField()
    content = serializers.CharField()
    status = serializers.CharField()
    metadata = serializers.DictField()
    created_by_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance):  # type: ignore[no-untyped-def]
        return {
            "id": str(instance.id),
            "organization_id": str(instance.organization_id),
            "type": instance.type,
            "title": instance.title,
            "content": instance.content,
            "status": instance.status,
            "metadata": instance.metadata,
            "created_by_id": str(instance.created_by_id) if instance.created_by_id else None,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
        }


class CampaignWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    name = serializers.CharField(max_length=255)
    channel = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(
        choices=Campaign.Status.choices, required=False, default="draft"
    )
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    asset_id = serializers.UUIDField(required=False, allow_null=True)
    metrics = serializers.DictField(required=False, default=dict)


class CampaignUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    channel = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=Campaign.Status.choices, required=False)
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    asset_id = serializers.UUIDField(required=False, allow_null=True)
    metrics = serializers.DictField(required=False)


class CampaignSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    name = serializers.CharField()
    channel = serializers.CharField()
    status = serializers.CharField()
    scheduled_at = serializers.DateTimeField(allow_null=True)
    asset_id = serializers.UUIDField(allow_null=True)
    metrics = serializers.DictField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance):  # type: ignore[no-untyped-def]
        return {
            "id": str(instance.id),
            "organization_id": str(instance.organization_id),
            "name": instance.name,
            "channel": instance.channel,
            "status": instance.status,
            "scheduled_at": instance.scheduled_at,
            "asset_id": str(instance.asset_id) if instance.asset_id else None,
            "metrics": instance.metrics,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
        }


class GenerateSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=MarketingAsset.Type.choices)
    prompt = serializers.CharField()
    tone = serializers.CharField(required=False, allow_blank=True, default="professional")
    product_name = serializers.CharField(required=False, allow_blank=True, default="")

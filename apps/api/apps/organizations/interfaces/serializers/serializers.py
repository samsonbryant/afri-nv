"""Organization serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.organizations.application.dto import MembershipDTO, OrganizationDTO
from apps.organizations.domain.entities import MembershipRole, Plan


class OrganizationWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=100)
    plan = serializers.ChoiceField(choices=[p.value for p in Plan], default=Plan.FREE.value)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    industry = serializers.CharField(required=False, allow_blank=True, max_length=128, default="")
    website = serializers.URLField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, max_length=64, default="")
    address = serializers.CharField(required=False, allow_blank=True, default="")


class OrganizationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    plan = serializers.ChoiceField(choices=[p.value for p in Plan], required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True, max_length=128)
    website = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=64)
    address = serializers.CharField(required=False, allow_blank=True)
    business_context = serializers.DictField(required=False)


class OrganizationSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    plan = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    business_context = serializers.DictField(required=False)
    logo_url = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: OrganizationDTO | dict) -> dict:
        if isinstance(instance, OrganizationDTO):
            return {
                "id": str(instance.id),
                "name": instance.name,
                "slug": instance.slug,
                "plan": instance.plan,
                "description": instance.description,
                "industry": instance.industry,
                "website": instance.website,
                "phone": instance.phone,
                "address": instance.address,
                "business_context": instance.business_context or {},
                "logo_url": instance.logo_url,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class AddMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(
        choices=[r.value for r in MembershipRole],
        default=MembershipRole.MEMBER.value,
    )


class MembershipSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    role = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: MembershipDTO | dict) -> dict:
        if isinstance(instance, MembershipDTO):
            return {
                "id": str(instance.id),
                "user_id": str(instance.user_id),
                "organization_id": str(instance.organization_id),
                "role": instance.role,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)

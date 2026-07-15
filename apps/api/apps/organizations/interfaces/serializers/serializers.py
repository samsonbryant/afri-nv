"""Organization serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.organizations.application.dto import MembershipDTO, OrganizationDTO
from apps.organizations.domain.entities import MembershipRole, Plan


class OrganizationWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=100)
    plan = serializers.ChoiceField(choices=[p.value for p in Plan], default=Plan.FREE.value)


class OrganizationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    plan = serializers.ChoiceField(choices=[p.value for p in Plan], required=False)


class OrganizationSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    slug = serializers.SlugField()
    plan = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: OrganizationDTO | dict) -> dict:
        if isinstance(instance, OrganizationDTO):
            return {
                "id": str(instance.id),
                "name": instance.name,
                "slug": instance.slug,
                "plan": instance.plan,
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

"""Platform admin serializers."""

from __future__ import annotations

from rest_framework import serializers


class AdminUserUpdateSerializer(serializers.Serializer):
    is_active = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(required=False)


class PlatformSettingUpdateSerializer(serializers.Serializer):
    value = serializers.DictField()
    description = serializers.CharField(required=False, allow_blank=True)

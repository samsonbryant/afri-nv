"""Developer serializers."""

from __future__ import annotations

from rest_framework import serializers


class WebhookWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    url = serializers.URLField()
    secret = serializers.CharField(required=False, allow_blank=True)
    events = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    is_active = serializers.BooleanField(required=False, default=True)


class WebhookUpdateSerializer(serializers.Serializer):
    url = serializers.URLField(required=False)
    secret = serializers.CharField(required=False, allow_blank=True)
    events = serializers.ListField(child=serializers.CharField(), required=False)
    is_active = serializers.BooleanField(required=False)


class ApiKeyWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    name = serializers.CharField(max_length=128)

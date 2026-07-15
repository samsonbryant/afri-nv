from __future__ import annotations

from rest_framework import serializers


class AuditLogSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    actor_id = serializers.UUIDField(allow_null=True)
    organization_id = serializers.UUIDField(allow_null=True)
    action = serializers.CharField()
    resource_type = serializers.CharField()
    resource_id = serializers.CharField()
    ip = serializers.CharField(allow_null=True)
    user_agent = serializers.CharField()
    metadata = serializers.DictField()
    created_at = serializers.DateTimeField()


class BackupWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField(required=False, allow_null=True)

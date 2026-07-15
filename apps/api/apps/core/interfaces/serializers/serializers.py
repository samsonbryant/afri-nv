"""Core serializers."""

from __future__ import annotations

from rest_framework import serializers


class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField()
    version = serializers.CharField()
    timestamp = serializers.DateTimeField()
    checks = serializers.DictField(child=serializers.CharField())

"""Reports serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.reports.infrastructure.models import Report


class ReportWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=Report.Type.choices)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    period_start = serializers.DateField(required=False, allow_null=True)
    period_end = serializers.DateField(required=False, allow_null=True)


class GenerateReportSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=Report.Type.choices)
    period_start = serializers.DateField(required=False, allow_null=True)
    period_end = serializers.DateField(required=False, allow_null=True)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")


class ReportSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    type = serializers.CharField()
    title = serializers.CharField()
    period_start = serializers.DateField(allow_null=True)
    period_end = serializers.DateField(allow_null=True)
    status = serializers.CharField()
    content = serializers.DictField()
    created_by_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance):  # type: ignore[no-untyped-def]
        return {
            "id": str(instance.id),
            "organization_id": str(instance.organization_id),
            "type": instance.type,
            "title": instance.title,
            "period_start": instance.period_start,
            "period_end": instance.period_end,
            "status": instance.status,
            "content": instance.content,
            "created_by_id": str(instance.created_by_id) if instance.created_by_id else None,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
        }

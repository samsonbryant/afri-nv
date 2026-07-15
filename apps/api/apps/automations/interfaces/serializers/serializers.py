"""Automation serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.automations.application.dto import AutomationRunDTO


class TriggerAutomationSerializer(serializers.Serializer):
    workflow_id = serializers.UUIDField()
    input_payload = serializers.DictField(required=False, default=dict)


class AutomationRunSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    workflow_id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    status = serializers.CharField()
    input_payload = serializers.DictField()
    output_payload = serializers.DictField()
    error_message = serializers.CharField()
    triggered_by_id = serializers.UUIDField(allow_null=True)
    started_at = serializers.DateTimeField(allow_null=True)
    finished_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: AutomationRunDTO | dict) -> dict:
        if isinstance(instance, AutomationRunDTO):
            return {
                "id": str(instance.id),
                "workflow_id": str(instance.workflow_id),
                "organization_id": str(instance.organization_id),
                "status": instance.status,
                "input_payload": instance.input_payload,
                "output_payload": instance.output_payload,
                "error_message": instance.error_message,
                "triggered_by_id": str(instance.triggered_by_id)
                if instance.triggered_by_id
                else None,
                "started_at": instance.started_at,
                "finished_at": instance.finished_at,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)

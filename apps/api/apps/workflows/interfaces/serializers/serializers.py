"""Workflow serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.workflows.application.dto import WorkflowDTO
from apps.workflows.domain.entities import WorkflowStatus


class WorkflowWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    definition = serializers.DictField(required=False, default=dict)
    status = serializers.ChoiceField(
        choices=[s.value for s in WorkflowStatus],
        default=WorkflowStatus.DRAFT.value,
        required=False,
    )


class WorkflowUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    definition = serializers.DictField(required=False)
    status = serializers.ChoiceField(
        choices=[s.value for s in WorkflowStatus],
        required=False,
    )


class WorkflowSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    name = serializers.CharField()
    description = serializers.CharField()
    definition = serializers.DictField()
    status = serializers.CharField()
    created_by_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: WorkflowDTO | dict) -> dict:
        if isinstance(instance, WorkflowDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "name": instance.name,
                "description": instance.description,
                "definition": instance.definition,
                "status": instance.status,
                "created_by_id": str(instance.created_by_id) if instance.created_by_id else None,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)

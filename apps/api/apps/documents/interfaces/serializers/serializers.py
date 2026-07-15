"""Documents serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.documents.infrastructure.models import DocumentJob


class DocumentUploadSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    file = serializers.FileField(required=False, allow_null=True)


class StudioDocumentSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    title = serializers.CharField()
    file_type = serializers.CharField()
    extracted_text = serializers.CharField()
    status = serializers.CharField()
    created_by_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    file_url = serializers.CharField(allow_null=True, required=False)

    def to_representation(self, instance):  # type: ignore[no-untyped-def]
        return {
            "id": str(instance.id),
            "organization_id": str(instance.organization_id),
            "title": instance.title,
            "file_type": instance.file_type,
            "extracted_text": instance.extracted_text,
            "status": instance.status,
            "created_by_id": str(instance.created_by_id) if instance.created_by_id else None,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
            "file_url": instance.file_url,
        }


class JobCreateSerializer(serializers.Serializer):
    job_type = serializers.ChoiceField(choices=DocumentJob.JobType.choices)
    params = serializers.DictField(required=False, default=dict)


class DocumentJobSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    document_id = serializers.UUIDField()
    job_type = serializers.CharField()
    status = serializers.CharField()
    params = serializers.DictField()
    result = serializers.DictField()
    error = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance):  # type: ignore[no-untyped-def]
        return {
            "id": str(instance.id),
            "document_id": str(instance.document_id),
            "job_type": instance.job_type,
            "status": instance.status,
            "params": instance.params,
            "result": instance.result,
            "error": instance.error,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
        }

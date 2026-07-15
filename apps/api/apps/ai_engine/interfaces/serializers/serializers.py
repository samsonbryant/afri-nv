"""AI engine serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.ai_engine.application.dto import DocumentDTO, SearchHitDTO


class DocumentWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255)
    content = serializers.CharField()
    source = serializers.CharField(required=False, default="manual", max_length=64)
    metadata = serializers.DictField(required=False, default=dict)


class DocumentSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    title = serializers.CharField()
    content = serializers.CharField()
    source = serializers.CharField()
    metadata = serializers.DictField()
    has_embedding = serializers.BooleanField()
    created_by_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: DocumentDTO | dict) -> dict:
        if isinstance(instance, DocumentDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "title": instance.title,
                "content": instance.content,
                "source": instance.source,
                "metadata": instance.metadata,
                "has_embedding": instance.has_embedding,
                "created_by_id": str(instance.created_by_id) if instance.created_by_id else None,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class SearchQuerySerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    query = serializers.CharField()
    limit = serializers.IntegerField(required=False, default=5, min_value=1, max_value=50)


class SearchHitSerializer(serializers.Serializer):
    document = DocumentSerializer()
    score = serializers.FloatField()

    def to_representation(self, instance: SearchHitDTO | dict) -> dict:
        if isinstance(instance, SearchHitDTO):
            return {
                "document": DocumentSerializer(instance.document).data,
                "score": instance.score,
            }
        return super().to_representation(instance)

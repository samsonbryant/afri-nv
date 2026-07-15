"""Knowledge serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.knowledge.application.dto import (
    KnowledgeChunkDTO,
    KnowledgeConversationDTO,
    KnowledgeDocumentDTO,
    KnowledgeMessageDTO,
)


class DocumentUploadSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    file = serializers.FileField(required=False)


class DocumentSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    title = serializers.CharField()
    file_type = serializers.CharField()
    status = serializers.CharField()
    page_count = serializers.IntegerField()
    chunk_count = serializers.IntegerField()
    error_message = serializers.CharField()
    metadata = serializers.DictField()
    created_by_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    file_url = serializers.CharField(allow_null=True, required=False)

    def to_representation(self, instance: KnowledgeDocumentDTO | dict) -> dict:
        if isinstance(instance, KnowledgeDocumentDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "title": instance.title,
                "file_type": instance.file_type,
                "status": instance.status,
                "page_count": instance.page_count,
                "chunk_count": instance.chunk_count,
                "error_message": instance.error_message,
                "metadata": instance.metadata,
                "created_by_id": str(instance.created_by_id) if instance.created_by_id else None,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
                "file_url": instance.file_url,
            }
        return super().to_representation(instance)


class ChunkSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    document_id = serializers.UUIDField()
    index = serializers.IntegerField()
    content = serializers.CharField()
    metadata = serializers.DictField()
    created_at = serializers.DateTimeField()

    def to_representation(self, instance: KnowledgeChunkDTO | dict) -> dict:
        if isinstance(instance, KnowledgeChunkDTO):
            return {
                "id": str(instance.id),
                "document_id": str(instance.document_id),
                "index": instance.index,
                "content": instance.content,
                "metadata": instance.metadata,
                "created_at": instance.created_at,
            }
        return super().to_representation(instance)


class ConversationWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    title = serializers.CharField(required=False, allow_blank=True, default="New conversation")


class ConversationSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    title = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: KnowledgeConversationDTO | dict) -> dict:
        if isinstance(instance, KnowledgeConversationDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "user_id": str(instance.user_id),
                "title": instance.title,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField()


class MessageSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    conversation_id = serializers.UUIDField()
    role = serializers.CharField()
    content = serializers.CharField()
    citations = serializers.ListField()
    created_at = serializers.DateTimeField()

    def to_representation(self, instance: KnowledgeMessageDTO | dict) -> dict:
        if isinstance(instance, KnowledgeMessageDTO):
            return {
                "id": str(instance.id),
                "conversation_id": str(instance.conversation_id),
                "role": instance.role,
                "content": instance.content,
                "citations": instance.citations,
                "created_at": instance.created_at,
            }
        return super().to_representation(instance)

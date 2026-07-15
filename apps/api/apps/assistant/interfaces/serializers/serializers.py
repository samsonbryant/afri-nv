"""Assistant serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.assistant.application.dto import ConversationDTO, MessageDTO, UploadResultDTO


class CreateConversationSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    title = serializers.CharField(required=False, allow_blank=True, default="New conversation")


class UpdateConversationSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=False)


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField()
    content_type = serializers.ChoiceField(
        choices=["text", "markdown", "code", "image"],
        required=False,
        default="markdown",
    )
    attachments = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )


class ConversationSerializer(serializers.Serializer):
    def to_representation(self, instance: ConversationDTO | dict) -> dict:
        if isinstance(instance, ConversationDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "user_id": str(instance.user_id),
                "title": instance.title,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class MessageSerializer(serializers.Serializer):
    def to_representation(self, instance: MessageDTO | dict) -> dict:
        if isinstance(instance, MessageDTO):
            return {
                "id": str(instance.id),
                "conversation_id": str(instance.conversation_id),
                "role": instance.role,
                "content": instance.content,
                "content_type": instance.content_type,
                "attachments": instance.attachments,
                "citations": instance.citations,
                "created_at": instance.created_at,
            }
        return super().to_representation(instance)


class UploadResultSerializer(serializers.Serializer):
    def to_representation(self, instance: UploadResultDTO | dict) -> dict:
        if isinstance(instance, UploadResultDTO):
            return {
                "url": instance.url,
                "name": instance.name,
                "content_type": instance.content_type,
                "size": instance.size,
            }
        return super().to_representation(instance)

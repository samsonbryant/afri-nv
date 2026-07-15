from __future__ import annotations

from rest_framework import serializers


class AgentWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    type = serializers.ChoiceField(
        choices=["sales", "marketing", "hr", "finance", "legal", "research", "support", "executive"]
    )
    name = serializers.CharField(required=False, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    system_prompt = serializers.CharField(required=False, allow_blank=True, default="")
    tools = serializers.ListField(required=False, default=list)
    is_active = serializers.BooleanField(required=False, default=True)
    config = serializers.DictField(required=False, default=dict)


class AgentUpdateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(
        choices=[
            "sales",
            "marketing",
            "hr",
            "finance",
            "legal",
            "research",
            "support",
            "executive",
        ],
        required=False,
    )
    name = serializers.CharField(required=False, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    system_prompt = serializers.CharField(required=False, allow_blank=True)
    tools = serializers.ListField(required=False)
    is_active = serializers.BooleanField(required=False)
    config = serializers.DictField(required=False)


class AgentSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    type = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    system_prompt = serializers.CharField()
    tools = serializers.ListField()
    is_active = serializers.BooleanField()
    config = serializers.DictField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class AgentRunWriteSerializer(serializers.Serializer):
    message = serializers.CharField()
    context = serializers.DictField(required=False, default=dict)


class AgentRunSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    agent_id = serializers.UUIDField()
    user_id = serializers.UUIDField(allow_null=True)
    input = serializers.CharField()
    output = serializers.CharField()
    status = serializers.CharField()
    tokens_used = serializers.IntegerField()
    citations = serializers.ListField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

"""Support serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.support.application.dto import ChannelDTO, SupportStatsDTO, TicketDTO, TicketMessageDTO
from apps.support.domain.entities import ChannelType, TicketPriority, TicketStatus


class ChannelWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=[t.value for t in ChannelType])
    name = serializers.CharField(max_length=255)
    config = serializers.DictField(required=False, default=dict)
    is_active = serializers.BooleanField(required=False, default=True)


class ChannelUpdateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=[t.value for t in ChannelType], required=False)
    name = serializers.CharField(required=False)
    config = serializers.DictField(required=False)
    is_active = serializers.BooleanField(required=False)


class ChannelSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    type = serializers.CharField()
    name = serializers.CharField()
    config = serializers.DictField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: ChannelDTO | dict) -> dict:
        if isinstance(instance, ChannelDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "type": instance.type,
                "name": instance.name,
                "config": instance.config,
                "is_active": instance.is_active,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class TicketWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    channel_id = serializers.UUIDField(required=False, allow_null=True)
    subject = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(
        choices=[s.value for s in TicketStatus], required=False, default=TicketStatus.OPEN.value
    )
    priority = serializers.ChoiceField(
        choices=[p.value for p in TicketPriority],
        required=False,
        default=TicketPriority.MEDIUM.value,
    )
    requester_email = serializers.EmailField(required=False, allow_blank=True, default="")
    requester_name = serializers.CharField(required=False, allow_blank=True, default="")
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)


class TicketUpdateSerializer(serializers.Serializer):
    channel_id = serializers.UUIDField(required=False, allow_null=True)
    subject = serializers.CharField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=[s.value for s in TicketStatus], required=False)
    priority = serializers.ChoiceField(choices=[p.value for p in TicketPriority], required=False)
    requester_email = serializers.EmailField(required=False, allow_blank=True)
    requester_name = serializers.CharField(required=False, allow_blank=True)
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False)


class TicketSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    channel_id = serializers.UUIDField(allow_null=True)
    subject = serializers.CharField()
    description = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()
    requester_email = serializers.CharField()
    requester_name = serializers.CharField()
    assignee_id = serializers.UUIDField(allow_null=True)
    tags = serializers.ListField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: TicketDTO | dict) -> dict:
        if isinstance(instance, TicketDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "channel_id": str(instance.channel_id) if instance.channel_id else None,
                "subject": instance.subject,
                "description": instance.description,
                "status": instance.status,
                "priority": instance.priority,
                "requester_email": instance.requester_email,
                "requester_name": instance.requester_name,
                "assignee_id": str(instance.assignee_id) if instance.assignee_id else None,
                "tags": instance.tags,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class TicketMessageWriteSerializer(serializers.Serializer):
    body = serializers.CharField()
    sender_type = serializers.ChoiceField(
        choices=["customer", "agent", "ai", "system"], required=False, default="agent"
    )
    attachments = serializers.ListField(required=False, default=list)
    is_internal = serializers.BooleanField(required=False, default=False)


class TicketMessageSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    ticket_id = serializers.UUIDField()
    sender_type = serializers.CharField()
    body = serializers.CharField()
    attachments = serializers.ListField()
    is_internal = serializers.BooleanField()
    created_at = serializers.DateTimeField()

    def to_representation(self, instance: TicketMessageDTO | dict) -> dict:
        if isinstance(instance, TicketMessageDTO):
            return {
                "id": str(instance.id),
                "ticket_id": str(instance.ticket_id),
                "sender_type": instance.sender_type,
                "body": instance.body,
                "attachments": instance.attachments,
                "is_internal": instance.is_internal,
                "created_at": instance.created_at,
            }
        return super().to_representation(instance)


class AssignSerializer(serializers.Serializer):
    assignee_id = serializers.UUIDField(required=False, allow_null=True)


class AiReplySerializer(serializers.Serializer):
    post = serializers.BooleanField(required=False, default=True)


class StatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    open = serializers.IntegerField()
    pending = serializers.IntegerField()
    resolved = serializers.IntegerField()
    closed = serializers.IntegerField()
    by_priority = serializers.DictField()

    def to_representation(self, instance: SupportStatsDTO | dict) -> dict:
        if isinstance(instance, SupportStatsDTO):
            return {
                "total": instance.total,
                "open": instance.open,
                "pending": instance.pending,
                "resolved": instance.resolved,
                "closed": instance.closed,
                "by_priority": instance.by_priority,
            }
        return super().to_representation(instance)

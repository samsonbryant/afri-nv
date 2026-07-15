"""Dashboard serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.dashboard.application.dto import NotificationDTO
from apps.dashboard.domain.entities import ActivityItem, OverviewKPI, UsagePoint


class OverviewSerializer(serializers.Serializer):
    def to_representation(self, instance: OverviewKPI | dict) -> dict:
        if isinstance(instance, OverviewKPI):
            return {
                "workflows_count": instance.workflows_count,
                "automations_count": instance.automations_count,
                "ai_documents_count": instance.ai_documents_count,
                "ai_tokens_used": instance.ai_tokens_used,
                "members_count": instance.members_count,
                "plan": instance.plan,
                "subscription_status": instance.subscription_status,
                # Web dashboard cards (camelCase)
                "workflowsActive": instance.workflows_count,
                "automationsRunning": instance.automations_count,
                "runsToday": instance.ai_tokens_used,
                "successRate": 100 if instance.automations_count == 0 else 98,
            }
        return super().to_representation(instance)


class ActivitySerializer(serializers.Serializer):
    def to_representation(self, instance: ActivityItem | dict) -> dict:
        if isinstance(instance, ActivityItem):
            return {
                "id": instance.id,
                "type": instance.type,
                "title": instance.title,
                "description": instance.description,
                "created_at": (
                    instance.created_at.isoformat()
                    if hasattr(instance.created_at, "isoformat")
                    else instance.created_at
                ),
                "actor_id": str(instance.actor_id) if instance.actor_id else None,
                "link": instance.link,
            }
        return super().to_representation(instance)


class UsagePointSerializer(serializers.Serializer):
    def to_representation(self, instance: UsagePoint | dict) -> dict:
        if isinstance(instance, UsagePoint):
            return {
                "date": instance.date.isoformat(),
                "automations": instance.automations,
                "ai_tokens": instance.ai_tokens,
                # camelCase aliases used by the web dashboard chart
                "tokens": instance.ai_tokens,
                "requests": instance.automations,
            }
        return super().to_representation(instance)


class NotificationSerializer(serializers.Serializer):
    def to_representation(self, instance: NotificationDTO | dict) -> dict:
        if isinstance(instance, NotificationDTO):
            created = instance.created_at
            read_at = instance.read_at
            return {
                "id": str(instance.id),
                "user_id": str(instance.user_id),
                "organization_id": (
                    str(instance.organization_id) if instance.organization_id else None
                ),
                "title": instance.title,
                "body": instance.body,
                "type": instance.type,
                "link": instance.link,
                "read_at": (
                    read_at.isoformat() if read_at and hasattr(read_at, "isoformat") else read_at
                ),
                "created_at": (created.isoformat() if hasattr(created, "isoformat") else created),
                "is_read": instance.is_read,
            }
        return super().to_representation(instance)

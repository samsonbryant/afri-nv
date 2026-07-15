"""Developer platform services."""

from __future__ import annotations

import hashlib
import secrets
from uuid import UUID

from django.utils import timezone

from apps.developer.domain.exceptions import ApiKeyNotFoundError, WebhookEndpointNotFoundError
from apps.developer.infrastructure.models import ApiKey, WebhookDelivery, WebhookEndpoint
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository


class DeveloperService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    # Webhooks
    def list_webhooks(self, actor_id: UUID, organization_id: UUID) -> list[dict]:
        self._require_member(actor_id, organization_id)
        return [
            self._webhook_dict(w)
            for w in WebhookEndpoint.objects.filter(organization_id=organization_id)
        ]

    def create_webhook(self, actor_id: UUID, organization_id: UUID, data: dict) -> dict:
        self._require_member(actor_id, organization_id)
        endpoint = WebhookEndpoint.objects.create(
            organization_id=organization_id,
            url=data["url"],
            secret=data.get("secret") or secrets.token_urlsafe(24),
            events=data.get("events") or [],
            is_active=data.get("is_active", True),
        )
        return self._webhook_dict(endpoint)

    def get_webhook(self, actor_id: UUID, endpoint_id: UUID) -> dict:
        endpoint = self._get_webhook(endpoint_id)
        self._require_member(actor_id, endpoint.organization_id)
        return self._webhook_dict(endpoint)

    def update_webhook(self, actor_id: UUID, endpoint_id: UUID, data: dict) -> dict:
        endpoint = self._get_webhook(endpoint_id)
        self._require_member(actor_id, endpoint.organization_id)
        for key in ("url", "secret", "events", "is_active"):
            if key in data:
                setattr(endpoint, key, data[key])
        endpoint.save()
        return self._webhook_dict(endpoint)

    def delete_webhook(self, actor_id: UUID, endpoint_id: UUID) -> None:
        endpoint = self._get_webhook(endpoint_id)
        self._require_member(actor_id, endpoint.organization_id)
        endpoint.delete()

    def dispatch_event(self, organization_id: UUID, event: str, payload: dict) -> list[dict]:
        """Stub dispatcher — records deliveries without HTTP calls."""
        results = []
        qs = WebhookEndpoint.objects.filter(organization_id=organization_id, is_active=True)
        for endpoint in qs:
            events = endpoint.events or []
            if events and event not in events and "*" not in events:
                continue
            delivery = WebhookDelivery.objects.create(
                endpoint=endpoint,
                event=event,
                payload=payload,
                status=WebhookDelivery.Status.DELIVERED,
                response_code=200,
                response_body='{"stub": true}',
                delivered_at=timezone.now(),
            )
            results.append(
                {
                    "id": str(delivery.id),
                    "endpoint_id": str(endpoint.id),
                    "status": delivery.status,
                }
            )
        return results

    # API keys
    def list_api_keys(self, actor_id: UUID, organization_id: UUID) -> list[dict]:
        self._require_member(actor_id, organization_id)
        return [
            self._api_key_dict(k) for k in ApiKey.objects.filter(organization_id=organization_id)
        ]

    def create_api_key(self, actor_id: UUID, organization_id: UUID, data: dict) -> dict:
        self._require_member(actor_id, organization_id)
        raw = f"nvx_{secrets.token_urlsafe(32)}"
        prefix = raw[:12]
        key = ApiKey.objects.create(
            organization_id=organization_id,
            name=data["name"],
            prefix=prefix,
            hashed_key=hashlib.sha256(raw.encode()).hexdigest(),
            is_active=True,
        )
        result = self._api_key_dict(key)
        result["key"] = raw  # only returned once
        return result

    def delete_api_key(self, actor_id: UUID, key_id: UUID) -> None:
        key = self._get_api_key(key_id)
        self._require_member(actor_id, key.organization_id)
        key.delete()

    def authenticate_api_key(self, raw_key: str) -> ApiKey | None:
        if not raw_key:
            return None
        digest = hashlib.sha256(raw_key.encode()).hexdigest()
        prefix = raw_key[:12]
        try:
            key = ApiKey.objects.get(prefix=prefix, hashed_key=digest, is_active=True)
        except ApiKey.DoesNotExist:
            return None
        key.last_used_at = timezone.now()
        key.save(update_fields=["last_used_at", "updated_at"])
        return key

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_webhook(self, endpoint_id: UUID) -> WebhookEndpoint:
        try:
            return WebhookEndpoint.objects.get(pk=endpoint_id)
        except WebhookEndpoint.DoesNotExist as exc:
            raise WebhookEndpointNotFoundError() from exc

    def _get_api_key(self, key_id: UUID) -> ApiKey:
        try:
            return ApiKey.objects.get(pk=key_id)
        except ApiKey.DoesNotExist as exc:
            raise ApiKeyNotFoundError() from exc

    @staticmethod
    def _webhook_dict(w: WebhookEndpoint) -> dict:
        return {
            "id": str(w.id),
            "organization_id": str(w.organization_id),
            "url": w.url,
            "secret": w.secret,
            "events": w.events or [],
            "is_active": w.is_active,
            "created_at": w.created_at,
            "updated_at": w.updated_at,
        }

    @staticmethod
    def _api_key_dict(k: ApiKey) -> dict:
        return {
            "id": str(k.id),
            "organization_id": str(k.organization_id),
            "name": k.name,
            "prefix": k.prefix,
            "last_used_at": k.last_used_at,
            "is_active": k.is_active,
            "created_at": k.created_at,
            "updated_at": k.updated_at,
        }

"""Developer domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError


class WebhookEndpointNotFoundError(NotFoundError):
    default_message = "Webhook endpoint not found."
    code = "webhook_endpoint_not_found"


class ApiKeyNotFoundError(NotFoundError):
    default_message = "API key not found."
    code = "api_key_not_found"

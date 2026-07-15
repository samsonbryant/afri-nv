"""Optional X-API-Key authentication."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.developer.infrastructure.dependencies import get_developer_service

User = get_user_model()


class ApiKeyAuthentication(BaseAuthentication):
    """Authenticate via X-API-Key header. Does not replace JWT; optional."""

    keyword = "X-API-Key"

    def authenticate(self, request):  # type: ignore[no-untyped-def]
        raw = request.headers.get(self.keyword) or request.META.get("HTTP_X_API_KEY")
        if not raw:
            return None
        key = get_developer_service().authenticate_api_key(raw)
        if key is None:
            raise AuthenticationFailed("Invalid API key.")
        # Attach a synthetic system user if none; prefer org owner when available.
        user = (
            User.objects.filter(
                memberships__organization_id=key.organization_id,
                memberships__role="owner",
            )
            .order_by("date_joined")
            .first()
        )
        if user is None:
            raise AuthenticationFailed("API key organization has no owner.")
        request.api_key = key  # type: ignore[attr-defined]
        request.organization_id = key.organization_id  # type: ignore[attr-defined]
        return (user, key)

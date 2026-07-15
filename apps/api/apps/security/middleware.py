"""Simple per-IP rate limiting middleware using Django cache."""

from __future__ import annotations

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse


class RateLimitMiddleware:
    """Limit requests per client IP (default 100/min)."""

    def __init__(self, get_response):  # type: ignore[no-untyped-def]
        self.get_response = get_response
        self.limit = int(getattr(settings, "RATE_LIMIT_PER_MINUTE", 100))
        self.window = 60

    def __call__(self, request):  # type: ignore[no-untyped-def]
        if getattr(settings, "RATE_LIMIT_ENABLED", True):
            ip = self._client_ip(request)
            key = f"ratelimit:{ip}"
            count = cache.get(key)
            if count is None:
                cache.set(key, 1, timeout=self.window)
            elif int(count) >= self.limit:
                return JsonResponse(
                    {
                        "error": {
                            "code": "rate_limit_exceeded",
                            "message": "Too many requests. Try again shortly.",
                        }
                    },
                    status=429,
                )
            else:
                try:
                    cache.incr(key)
                except ValueError:
                    cache.set(key, 1, timeout=self.window)
        return self.get_response(request)

    @staticmethod
    def _client_ip(request) -> str:  # type: ignore[no-untyped-def]
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR") or "unknown"

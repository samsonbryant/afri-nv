"""Thin Redis client wrapper around Django's cache / redis-py."""

from __future__ import annotations

from typing import Any

import redis
from django.conf import settings
from django.core.cache import cache


def get_redis_client() -> redis.Redis:
    """Return a low-level Redis client for advanced operations."""
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


class CacheService:
    """Application-facing cache helper."""

    def get(self, key: str, default: Any = None) -> Any:
        return cache.get(key, default)

    def set(self, key: str, value: Any, timeout: int | None = None) -> None:
        cache.set(key, value, timeout=timeout)

    def delete(self, key: str) -> None:
        cache.delete(key)

    def get_or_set(self, key: str, default: Any, timeout: int | None = None) -> Any:
        return cache.get_or_set(key, default, timeout=timeout)

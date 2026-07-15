"""Shared OpenAI-compatible client (OpenAI, OpenRouter, Azure-compatible gateways)."""

from __future__ import annotations

from typing import Any

from django.conf import settings

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def resolve_openai_base_url(api_key: str | None = None) -> str | None:
    """Return an explicit or auto-detected OpenAI-compatible base URL."""
    configured = (getattr(settings, "OPENAI_BASE_URL", "") or "").strip()
    if configured:
        return configured.rstrip("/")
    key = api_key if api_key is not None else (getattr(settings, "OPENAI_API_KEY", "") or "")
    if key.startswith("sk-or-"):
        return OPENROUTER_BASE_URL
    return None


def resolve_chat_model(model: str | None = None) -> str:
    """Normalize chat model ids for OpenRouter when needed."""
    name = (model or getattr(settings, "AI_DEFAULT_MODEL", "gpt-4o") or "gpt-4o").strip()
    base = resolve_openai_base_url() or ""
    if "openrouter.ai" in base and "/" not in name:
        return f"openai/{name}"
    return name


def resolve_embedding_model(model: str | None = None) -> str:
    name = (model or getattr(settings, "EMBEDDING_MODEL", "text-embedding-3-small") or "").strip()
    base = resolve_openai_base_url() or ""
    if "openrouter.ai" in base and "/" not in name:
        return f"openai/{name}"
    return name


def get_openai_client(api_key: str | None = None) -> Any:
    """Build an OpenAI SDK client pointed at OpenAI or a compatible gateway."""
    from openai import OpenAI

    key = (api_key if api_key is not None else getattr(settings, "OPENAI_API_KEY", "")) or ""
    if not key:
        raise ValueError("OPENAI_API_KEY is not configured.")

    kwargs: dict[str, Any] = {"api_key": key}
    base_url = resolve_openai_base_url(key)
    if base_url:
        kwargs["base_url"] = base_url
    if base_url and "openrouter.ai" in base_url:
        frontend = getattr(settings, "FRONTEND_URL", "") or "http://localhost:3000"
        kwargs["default_headers"] = {
            "HTTP-Referer": frontend,
            "X-Title": "Novixa",
        }
    return OpenAI(**kwargs)

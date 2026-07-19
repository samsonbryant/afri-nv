"""Shared LLM text completion — OpenAI when configured, soft stub otherwise."""

from __future__ import annotations

import logging
from typing import Protocol

from django.conf import settings

logger = logging.getLogger("infrastructure.ai")


class LLMProvider(Protocol):
    def complete(
        self,
        prompt: str,
        *,
        system: str = "",
        temperature: float = 0.4,
        max_tokens: int | None = None,
    ) -> str: ...


class StubLLMProvider:
    """Deterministic stub responses when OpenAI is unavailable."""

    def complete(
        self,
        prompt: str,
        *,
        system: str = "",
        temperature: float = 0.4,
        max_tokens: int | None = None,
    ) -> str:
        preview = prompt.strip().replace("\n", " ")[:280]
        context = system.strip()[:120] if system else "Novixa AI"
        return (
            f"[stub] {context}\n\n"
            f"Based on your request:\n> {preview}\n\n"
            f"This is a stub response. Configure OPENAI_API_KEY for live generation."
        )


def _openai_failure_message(exc: BaseException) -> str:
    text = str(exc)
    if "requires more credits" in text or '"code": 402' in text or "Error code: 402" in text:
        return (
            "[ai-credits] The AI provider rejected this request (not enough credits for the "
            "reserved max_tokens). Add credits at https://openrouter.ai/settings/credits "
            f"or lower AI_MAX_TOKENS (currently {getattr(settings, 'AI_MAX_TOKENS', 1024)})."
        )
    if "insufficient_quota" in text or "exceeded your current quota" in text:
        return (
            "[openai-quota] OpenAI returned insufficient_quota. "
            "Add billing credits at https://platform.openai.com/settings/organization/billing"
        )
    if "invalid_api_key" in text or "Incorrect API key" in text:
        return (
            "[openai-auth] Invalid API key for the configured AI endpoint. "
            "Use a platform.openai.com key, or an OpenRouter sk-or- key with "
            "OPENAI_BASE_URL=https://openrouter.ai/api/v1."
        )
    return f"[openai-error] {text[:240]}"


class OpenAILLMProvider:
    def __init__(self, api_key: str, model: str) -> None:
        from infrastructure.ai.client import get_openai_client, resolve_chat_model

        self.client = get_openai_client(api_key)
        self.model = resolve_chat_model(model)

    def complete(
        self,
        prompt: str,
        *,
        system: str = "",
        temperature: float = 0.4,
        max_tokens: int | None = None,
    ) -> str:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        limit = (
            max_tokens
            if max_tokens is not None
            else int(getattr(settings, "AI_MAX_TOKENS", 1024) or 1024)
        )
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=limit,
        )
        return completion.choices[0].message.content or ""


class LLMService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider or self._default_provider()

    @staticmethod
    def _default_provider() -> LLMProvider:
        api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        if api_key:
            return OpenAILLMProvider(
                api_key=api_key,
                model=getattr(settings, "AI_DEFAULT_MODEL", "gpt-4o-mini"),
            )
        return StubLLMProvider()

    def complete(
        self,
        prompt: str,
        *,
        system: str = "",
        temperature: float = 0.4,
        max_tokens: int | None = None,
        organization_id: str | None = None,
    ) -> str:
        from infrastructure.ai.quota import (
            blocked_upgrade_reply,
            evaluate_free_tier,
            minimize_free_reply,
        )

        tier = evaluate_free_tier(organization_id) if organization_id else None
        if tier and tier.is_free and not tier.allowed:
            return blocked_upgrade_reply(prompt[:120])

        tokens = max_tokens
        if tokens is None and tier is not None:
            tokens = tier.max_tokens

        try:
            text = self._provider.complete(
                prompt, system=system, temperature=temperature, max_tokens=tokens
            )
        except Exception as exc:
            logger.exception("LLM completion failed; using stub fallback.")
            return (
                f"{_openai_failure_message(exc)}\n\n"
                f"Prompt preview: {prompt.strip().replace(chr(10), ' ')[:200]}"
            )

        if tier and tier.is_free:
            return minimize_free_reply(text, remaining=max(0, tier.remaining - 1))
        return text


_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def reset_llm_service() -> None:
    """Clear the cached provider (e.g. after env changes)."""
    global _llm_service
    _llm_service = None


def complete(
    prompt: str,
    *,
    system: str = "",
    temperature: float = 0.4,
    max_tokens: int | None = None,
    organization_id: str | None = None,
) -> str:
    """Convenience wrapper for one-shot completions."""
    return get_llm_service().complete(
        prompt,
        system=system,
        temperature=temperature,
        max_tokens=max_tokens,
        organization_id=organization_id,
    )

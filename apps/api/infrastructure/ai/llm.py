"""Shared LLM text completion — OpenAI when configured, soft stub otherwise."""

from __future__ import annotations

import logging
from typing import Protocol

from django.conf import settings

logger = logging.getLogger("infrastructure.ai")


class LLMProvider(Protocol):
    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.4) -> str: ...


class StubLLMProvider:
    """Deterministic stub responses when OpenAI is unavailable."""

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.4) -> str:
        preview = prompt.strip().replace("\n", " ")[:280]
        context = system.strip()[:120] if system else "Novixa AI"
        return (
            f"[stub] {context}\n\n"
            f"Based on your request:\n> {preview}\n\n"
            f"This is a stub response. Configure OPENAI_API_KEY for live generation."
        )


def _openai_failure_message(exc: BaseException) -> str:
    text = str(exc)
    if "insufficient_quota" in text or "exceeded your current quota" in text:
        return (
            "[openai-quota] OpenAI returned insufficient_quota. "
            "Add billing credits at https://platform.openai.com/settings/organization/billing"
        )
    if "invalid_api_key" in text or "Incorrect API key" in text:
        return "[openai-auth] Invalid OPENAI_API_KEY."
    return f"[openai-error] {text[:240]}"


class OpenAILLMProvider:
    def __init__(self, api_key: str, model: str) -> None:
        from openai import OpenAI

        self.client = OpenAI(api_key=api_key)
        self.model = model

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.4) -> str:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
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
                model=getattr(settings, "AI_DEFAULT_MODEL", "gpt-4o"),
            )
        return StubLLMProvider()

    def complete(self, prompt: str, *, system: str = "", temperature: float = 0.4) -> str:
        try:
            return self._provider.complete(prompt, system=system, temperature=temperature)
        except Exception as exc:
            logger.exception("LLM completion failed; using stub fallback.")
            return (
                f"{_openai_failure_message(exc)}\n\n"
                f"Prompt preview: {prompt.strip().replace(chr(10), ' ')[:200]}"
            )


_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def complete(prompt: str, *, system: str = "", temperature: float = 0.4) -> str:
    """Convenience wrapper for one-shot completions."""
    return get_llm_service().complete(prompt, system=system, temperature=temperature)

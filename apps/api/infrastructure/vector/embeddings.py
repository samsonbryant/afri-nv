"""Embedding service — OpenAI when configured, deterministic stub otherwise."""

from __future__ import annotations

import hashlib
import math
from typing import Protocol

import structlog
from django.conf import settings

logger = structlog.get_logger(__name__)


class EmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]: ...

    def embed_many(self, texts: list[str]) -> list[list[float]]: ...


class StubEmbeddingProvider:
    """Deterministic pseudo-embeddings for local/dev/test without API keys."""

    def __init__(self, dimensions: int) -> None:
        self.dimensions = dimensions

    def embed(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values: list[float] = []
        seed = digest
        while len(values) < self.dimensions:
            for byte in seed:
                values.append((byte / 255.0) * 2.0 - 1.0)
                if len(values) >= self.dimensions:
                    break
            seed = hashlib.sha256(seed).digest()
        # L2-normalize
        norm = math.sqrt(sum(v * v for v in values)) or 1.0
        return [v / norm for v in values]

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        return [self.embed(t) for t in texts]


class OpenAIEmbeddingProvider:
    """OpenAI embeddings adapter."""

    def __init__(self, api_key: str, model: str, dimensions: int) -> None:
        from openai import OpenAI

        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.dimensions = dimensions

    def embed(self, text: str) -> list[float]:
        response = self.client.embeddings.create(
            model=self.model,
            input=text,
            dimensions=self.dimensions,
        )
        return list(response.data[0].embedding)

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = self.client.embeddings.create(
            model=self.model,
            input=texts,
            dimensions=self.dimensions,
        )
        ordered = sorted(response.data, key=lambda item: item.index)
        return [list(item.embedding) for item in ordered]


class EmbeddingService:
    """Facade used by the AI engine application layer."""

    def __init__(self, provider: EmbeddingProvider | None = None) -> None:
        self._provider = provider or self._default_provider()

    @staticmethod
    def _default_provider() -> EmbeddingProvider:
        dimensions = int(settings.EMBEDDING_DIMENSIONS)
        api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        if api_key:
            logger.info("embedding_provider", provider="openai")
            return OpenAIEmbeddingProvider(
                api_key=api_key,
                model=settings.EMBEDDING_MODEL,
                dimensions=dimensions,
            )
        logger.info("embedding_provider", provider="stub")
        return StubEmbeddingProvider(dimensions=dimensions)

    def embed(self, text: str) -> list[float]:
        return self._provider.embed(text)

    def embed_many(self, texts: list[str]) -> list[list[float]]:
        return self._provider.embed_many(texts)


def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()

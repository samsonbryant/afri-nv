"""Unit tests for stub embedding service."""

from __future__ import annotations

from infrastructure.vector.embeddings import StubEmbeddingProvider


def test_stub_embedding_is_deterministic_and_normalized() -> None:
    provider = StubEmbeddingProvider(dimensions=32)
    a = provider.embed("hello novixa")
    b = provider.embed("hello novixa")
    c = provider.embed("different text")
    assert a == b
    assert a != c
    assert len(a) == 32
    norm = sum(x * x for x in a) ** 0.5
    assert abs(norm - 1.0) < 1e-6

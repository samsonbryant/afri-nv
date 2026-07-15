"""Integration: Celery ping task."""

from __future__ import annotations

import pytest

from infrastructure.celery.tasks import ping


@pytest.mark.django_db
@pytest.mark.integration
def test_celery_ping_task() -> None:
    assert ping() == "pong"

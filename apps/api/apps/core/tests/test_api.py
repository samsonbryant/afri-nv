"""Core API tests."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
@pytest.mark.integration
def test_health_endpoint() -> None:
    client = APIClient()
    url = reverse("core:health")
    response = client.get(url)
    assert response.status_code in {status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE}
    assert "status" in response.data
    assert "version" in response.data
    assert "checks" in response.data

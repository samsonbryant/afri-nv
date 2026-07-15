"""Accounts API tests."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
@pytest.mark.integration
def test_register_login_me_flow() -> None:
    client = APIClient()

    register_resp = client.post(
        reverse("accounts:register"),
        {
            "email": "bob@novixa.ai",
            "password": "securepass123",
            "first_name": "Bob",
            "last_name": "Builder",
        },
        format="json",
    )
    assert register_resp.status_code == status.HTTP_201_CREATED
    assert "tokens" in register_resp.data
    access = register_resp.data["tokens"]["access"]

    login_resp = client.post(
        reverse("accounts:login"),
        {"email": "bob@novixa.ai", "password": "securepass123"},
        format="json",
    )
    assert login_resp.status_code == status.HTTP_200_OK

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    me_resp = client.get(reverse("accounts:me"))
    assert me_resp.status_code == status.HTTP_200_OK
    assert me_resp.data["email"] == "bob@novixa.ai"

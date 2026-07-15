"""Organization API tests."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.infrastructure.models import User


@pytest.mark.django_db
@pytest.mark.integration
def test_organization_crud() -> None:
    user = User.objects.create_user(email="orgapi@novixa.ai", password="securepass123")
    client = APIClient()
    client.force_authenticate(user=user)

    create_resp = client.post(
        reverse("organizations:list-create"),
        {"name": "Nova Co", "slug": "nova-co", "plan": "free"},
        format="json",
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    org_id = create_resp.data["id"]

    list_resp = client.get(reverse("organizations:list-create"))
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data) == 1

    detail_resp = client.get(reverse("organizations:detail", kwargs={"org_id": org_id}))
    assert detail_resp.status_code == status.HTTP_200_OK
    assert detail_resp.data["slug"] == "nova-co"

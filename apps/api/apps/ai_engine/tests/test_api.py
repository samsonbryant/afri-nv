"""AI engine API tests."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.infrastructure.models import User
from apps.organizations.infrastructure.models import Membership, Organization


@pytest.mark.django_db
@pytest.mark.integration
def test_document_api() -> None:
    user = User.objects.create_user(email="aiapi@novixa.ai", password="securepass123")
    org = Organization.objects.create(name="AI API Org", slug="ai-api-org")
    Membership.objects.create(user=user, organization=org, role="owner")

    client = APIClient()
    client.force_authenticate(user=user)

    create_resp = client.post(
        reverse("ai_engine:documents"),
        {
            "organization_id": str(org.id),
            "title": "Handbook",
            "content": "Remote work is allowed on Fridays.",
        },
        format="json",
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    assert create_resp.data["has_embedding"] is True

    list_resp = client.get(
        reverse("ai_engine:documents"),
        {"organization_id": str(org.id)},
    )
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data) == 1

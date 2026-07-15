"""Workflow API tests."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.infrastructure.models import User
from apps.organizations.infrastructure.models import Membership, Organization


@pytest.mark.django_db
@pytest.mark.integration
def test_workflow_api_create_list() -> None:
    user = User.objects.create_user(email="wfapi@novixa.ai", password="securepass123")
    org = Organization.objects.create(name="API Org", slug="api-org")
    Membership.objects.create(user=user, organization=org, role="owner")

    client = APIClient()
    client.force_authenticate(user=user)

    create_resp = client.post(
        reverse("workflows:list-create"),
        {
            "organization_id": str(org.id),
            "name": "Lead Sync",
            "definition": {"trigger": "webhook"},
            "status": "draft",
        },
        format="json",
    )
    assert create_resp.status_code == status.HTTP_201_CREATED

    list_resp = client.get(
        reverse("workflows:list-create"),
        {"organization_id": str(org.id)},
    )
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data) == 1

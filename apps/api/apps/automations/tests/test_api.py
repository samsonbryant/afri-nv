"""Automation API tests."""

from __future__ import annotations

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.infrastructure.models import User
from apps.organizations.infrastructure.models import Membership, Organization
from apps.workflows.infrastructure.models import Workflow


@pytest.mark.django_db
@pytest.mark.integration
def test_trigger_automation_api() -> None:
    user = User.objects.create_user(email="autoapi@novixa.ai", password="securepass123")
    org = Organization.objects.create(name="Auto API Org", slug="auto-api-org")
    Membership.objects.create(user=user, organization=org, role="owner")
    workflow = Workflow.objects.create(
        organization=org,
        name="Ping",
        definition={},
        status="active",
        created_by=user,
    )

    client = APIClient()
    client.force_authenticate(user=user)

    trigger_resp = client.post(
        reverse("automations:trigger"),
        {"workflow_id": str(workflow.id), "input_payload": {"ping": True}},
        format="json",
    )
    assert trigger_resp.status_code == status.HTTP_201_CREATED
    assert trigger_resp.data["status"] in {"pending", "running", "succeeded"}

    list_resp = client.get(
        reverse("automations:list"),
        {"organization_id": str(org.id)},
    )
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data) >= 1

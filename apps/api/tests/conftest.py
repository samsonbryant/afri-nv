"""Pytest configuration and shared fixtures."""

from __future__ import annotations

import os

import pytest

# Ensure test settings are loaded before Django setup
os.environ.setdefault("DJANGO_ENV", "test")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def user(db):
    from apps.accounts.infrastructure.models import User

    return User.objects.create_user(
        email="fixture@novixa.ai",
        password="securepass123",
        first_name="Fixture",
        last_name="User",
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def organization(db, user):
    from apps.organizations.infrastructure.models import Membership, Organization

    org = Organization.objects.create(name="Fixture Org", slug="fixture-org", plan="free")
    Membership.objects.create(user=user, organization=org, role="owner")
    return org


@pytest.fixture
def workflow(db, organization, user):
    from apps.workflows.infrastructure.models import Workflow

    return Workflow.objects.create(
        organization=organization,
        name="Fixture Workflow",
        description="Test workflow",
        definition={"steps": []},
        status="active",
        created_by=user,
    )

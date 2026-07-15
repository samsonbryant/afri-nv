"""Meetings service tests."""

from __future__ import annotations

from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.meetings.infrastructure.dependencies import get_meeting_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_meetings_create_and_link() -> None:
    auth = get_auth_service()
    user = auth.register(RegisterUserDTO(email="meetings@novixa.ai", password="securepass123")).user
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Meet Org", slug="meet-org")
    )
    service = get_meeting_service()
    starts = timezone.now() + timedelta(hours=2)
    meeting = service.create_meeting(
        user.id,
        org.id,
        {
            "title": "Kickoff",
            "starts_at": starts,
            "ends_at": starts + timedelta(minutes=30),
            "provider": "zoom",
        },
    )
    assert meeting.title == "Kickoff"
    linked = service.create_meeting_link(user.id, meeting.id)
    assert "zoom.us" in linked.meeting_url

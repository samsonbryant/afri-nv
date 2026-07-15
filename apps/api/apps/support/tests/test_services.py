"""Support service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service
from apps.support.infrastructure.dependencies import get_support_service


@pytest.mark.django_db
@pytest.mark.unit
def test_support_ticket_ai_reply_and_stats() -> None:
    auth = get_auth_service()
    user = auth.register(RegisterUserDTO(email="support@novixa.ai", password="securepass123")).user
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Support Org", slug="support-org")
    )
    service = get_support_service()
    channel = service.create_channel(user.id, org.id, {"type": "email", "name": "Support Inbox"})
    ticket = service.create_ticket(
        user.id,
        org.id,
        {
            "channel_id": channel.id,
            "subject": "Cannot login",
            "description": "Password reset fails",
            "priority": "high",
        },
    )
    result = service.ai_reply(user.id, ticket.id, post=True)
    assert result["draft"]
    assert result["message"] is not None
    stats = service.stats(user.id, org.id)
    assert stats.total == 1
    assert stats.open + stats.pending >= 1

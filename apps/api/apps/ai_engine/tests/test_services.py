"""AI engine service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.ai_engine.application.dto import CreateDocumentDTO, SearchDocumentsDTO
from apps.ai_engine.infrastructure.dependencies import get_document_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_create_and_search_documents() -> None:
    auth = get_auth_service()
    user, _ = auth.register(RegisterUserDTO(email="ai@novixa.ai", password="securepass123"))
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="AI Org", slug="ai-org")
    )
    service = get_document_service()
    doc = service.create(
        user.id,
        CreateDocumentDTO(
            organization_id=org.id,
            title="Pricing Policy",
            content="Novixa Pro plan costs ninety-nine dollars per month.",
            source="manual",
        ),
    )
    assert doc.has_embedding is True

    hits = service.search(
        user.id,
        SearchDocumentsDTO(
            organization_id=org.id,
            query="What is the Pro plan price?",
            limit=3,
        ),
    )
    assert len(hits) >= 1
    assert hits[0].document.id == doc.id

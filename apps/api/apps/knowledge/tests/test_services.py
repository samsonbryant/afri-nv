"""Knowledge service tests."""

from __future__ import annotations

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.knowledge.application.dto import CreateConversationDTO, SendKnowledgeMessageDTO
from apps.knowledge.infrastructure.dependencies import get_knowledge_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_upload_and_process_document() -> None:
    auth = get_auth_service()
    user = auth.register(RegisterUserDTO(email="kb@novixa.ai", password="securepass123")).user
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="KB Org", slug="kb-org")
    )
    service = get_knowledge_service()
    uploaded = SimpleUploadedFile(
        "notes.csv",
        b"name,value\nalpha,1\nbeta,2\n",
        content_type="text/csv",
    )
    doc = service.upload_document(user.id, org.id, title="Notes CSV", uploaded=uploaded)
    assert doc.status == "ready"
    assert doc.chunk_count >= 1
    assert doc.file_type == "csv"

    chunks = service.list_chunks(user.id, doc.id)
    assert len(chunks) >= 1

    conversation = service.create_conversation(
        user.id, CreateConversationDTO(organization_id=org.id, title="Ask")
    )
    result = service.send_message(
        user.id,
        conversation.id,
        SendKnowledgeMessageDTO(content="What values are in the notes?"),
    )
    assert result.assistant_message.content
    assert result.user_message.role == "user"

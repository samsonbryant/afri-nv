"""Documents Studio service tests."""

from __future__ import annotations

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.accounts.application.dto import RegisterUserDTO
from apps.accounts.infrastructure.dependencies import get_auth_service
from apps.documents.infrastructure.dependencies import get_document_studio_service
from apps.organizations.application.dto import CreateOrganizationDTO
from apps.organizations.infrastructure.dependencies import get_organization_service


@pytest.mark.django_db
@pytest.mark.unit
def test_document_summarize_job() -> None:
    auth = get_auth_service()
    user = auth.register(RegisterUserDTO(email="docs@novixa.ai", password="securepass123")).user
    org = get_organization_service().create(
        user.id, CreateOrganizationDTO(name="Docs Org", slug="docs-org")
    )
    service = get_document_studio_service()
    uploaded = SimpleUploadedFile(
        "brief.txt",
        b"Novixa helps teams automate workflows and grow revenue.",
        content_type="text/plain",
    )
    doc = service.upload_document(user.id, org.id, title="Brief", uploaded=uploaded)
    assert doc.status == "ready"
    assert "Novixa" in doc.extracted_text

    job = service.create_job(user.id, doc.id, job_type="summarize", params={})
    assert job.status == "completed"
    assert job.result.get("summary")

"""Documents domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class StudioDocumentNotFoundError(NotFoundError):
    default_message = "Document not found."
    code = "studio_document_not_found"


class DocumentJobNotFoundError(NotFoundError):
    default_message = "Document job not found."
    code = "document_job_not_found"


class InvalidDocumentJobError(ValidationError):
    default_message = "Invalid document job parameters."
    code = "invalid_document_job"

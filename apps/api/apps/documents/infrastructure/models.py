"""Documents Studio ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class StudioDocument(BaseModel):
    class FileType(models.TextChoices):
        PDF = "pdf", "PDF"
        DOCX = "docx", "DOCX"
        PPTX = "pptx", "PPTX"
        XLSX = "xlsx", "XLSX"
        CSV = "csv", "CSV"
        IMAGE = "image", "Image"
        TEXT = "text", "Text"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="studio_documents",
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/", blank=True, null=True)
    file_type = models.CharField(
        max_length=16, choices=FileType.choices, default=FileType.OTHER, db_index=True
    )
    extracted_text = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_studio_documents",
    )

    class Meta:
        db_table = "documents_studio_document"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self) -> str:
        return self.title


class DocumentJob(BaseModel):
    class JobType(models.TextChoices):
        ANALYZE = "analyze", "Analyze"
        SUMMARIZE = "summarize", "Summarize"
        TRANSLATE = "translate", "Translate"
        COMPARE = "compare", "Compare"
        EXTRACT = "extract", "Extract"
        OCR = "ocr", "OCR"
        SEARCH = "search", "Search"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    document = models.ForeignKey(StudioDocument, on_delete=models.CASCADE, related_name="jobs")
    job_type = models.CharField(max_length=32, choices=JobType.choices, db_index=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    params = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True, default="")

    class Meta:
        db_table = "documents_job"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["document", "status"])]

    def __str__(self) -> str:
        return f"{self.job_type}:{self.status}"

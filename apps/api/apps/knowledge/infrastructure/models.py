"""Knowledge Base ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel
from infrastructure.vector.fields import EmbeddingField


class KnowledgeDocument(BaseModel):
    class FileType(models.TextChoices):
        PDF = "pdf", "PDF"
        DOCX = "docx", "DOCX"
        PPTX = "pptx", "PPTX"
        XLSX = "xlsx", "XLSX"
        CSV = "csv", "CSV"
        IMAGE = "image", "Image"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="knowledge_documents",
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="knowledge/", blank=True, null=True)
    file_type = models.CharField(
        max_length=16,
        choices=FileType.choices,
        default=FileType.OTHER,
        db_index=True,
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    page_count = models.PositiveIntegerField(default=0)
    chunk_count = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_knowledge_documents",
    )

    class Meta:
        db_table = "knowledge_document"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["organization", "status"]),
        ]

    def __str__(self) -> str:
        return self.title


class KnowledgeChunk(BaseModel):
    document = models.ForeignKey(
        KnowledgeDocument,
        on_delete=models.CASCADE,
        related_name="chunks",
    )
    index = models.PositiveIntegerField(default=0)
    content = models.TextField()
    embedding = EmbeddingField(
        dimensions=int(getattr(settings, "EMBEDDING_DIMENSIONS", 1536)),
        null=True,
        blank=True,
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "knowledge_chunk"
        ordering = ("document", "index")
        indexes = [
            models.Index(fields=["document", "index"]),
        ]

    def __str__(self) -> str:
        return f"Chunk {self.index} of {self.document_id}"


class KnowledgeConversation(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="knowledge_conversations",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="knowledge_conversations",
    )
    title = models.CharField(max_length=255, blank=True, default="New conversation")

    class Meta:
        db_table = "knowledge_conversation"
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["organization", "user"]),
        ]

    def __str__(self) -> str:
        return self.title


class KnowledgeMessage(BaseModel):
    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"
        SYSTEM = "system", "System"

    conversation = models.ForeignKey(
        KnowledgeConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=16, choices=Role.choices)
    content = models.TextField()
    citations = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "knowledge_message"
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"{self.role}: {self.content[:40]}"

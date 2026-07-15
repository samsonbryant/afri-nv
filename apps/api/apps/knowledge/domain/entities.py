"""Knowledge domain entities."""

from __future__ import annotations

from enum import StrEnum


class DocumentFileType(StrEnum):
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    XLSX = "xlsx"
    CSV = "csv"
    IMAGE = "image"
    OTHER = "other"


class DocumentStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

"""Documents domain entities."""

from __future__ import annotations

from enum import StrEnum


class DocumentJobType(StrEnum):
    ANALYZE = "analyze"
    SUMMARIZE = "summarize"
    TRANSLATE = "translate"
    COMPARE = "compare"
    EXTRACT = "extract"
    OCR = "ocr"
    SEARCH = "search"


class DocumentJobStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

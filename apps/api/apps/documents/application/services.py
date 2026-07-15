"""Documents Studio application services."""

from __future__ import annotations

import io
import logging
from pathlib import Path
from uuid import UUID

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction

from apps.documents.application.dto import DocumentJobDTO, StudioDocumentDTO
from apps.documents.domain.exceptions import (
    DocumentJobNotFoundError,
    InvalidDocumentJobError,
    StudioDocumentNotFoundError,
)
from apps.documents.infrastructure.models import DocumentJob, StudioDocument
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from infrastructure.ai.llm import complete

logger = logging.getLogger("apps.documents")


class DocumentStudioService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    def list_documents(self, actor_id: UUID, organization_id: UUID) -> list[StudioDocumentDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._document_dto(d)
            for d in StudioDocument.objects.filter(organization_id=organization_id)
        ]

    def upload_document(
        self,
        actor_id: UUID,
        organization_id: UUID,
        title: str,
        uploaded: UploadedFile | None = None,
    ) -> StudioDocumentDTO:
        self._require_member(actor_id, organization_id)
        doc = StudioDocument.objects.create(
            organization_id=organization_id,
            title=title or (uploaded.name if uploaded else "Untitled"),
            created_by_id=actor_id,
            status=StudioDocument.Status.PENDING,
        )
        if uploaded:
            doc.file = uploaded
            doc.file_type = self._detect_type(uploaded.name)
            doc.save(update_fields=["file", "file_type", "updated_at"])
        try:
            self._extract_text(doc)
        except Exception:
            doc.refresh_from_db()
        return self._document_dto(doc)

    def get_document(self, actor_id: UUID, document_id: UUID) -> StudioDocumentDTO:
        doc = self._get_document(document_id)
        self._require_member(actor_id, doc.organization_id)
        return self._document_dto(doc)

    def delete_document(self, actor_id: UUID, document_id: UUID) -> None:
        doc = self._get_document(document_id)
        self._require_member(actor_id, doc.organization_id)
        doc.delete()

    def create_job(
        self, actor_id: UUID, document_id: UUID, job_type: str, params: dict | None = None
    ) -> DocumentJobDTO:
        doc = self._get_document(document_id)
        self._require_member(actor_id, doc.organization_id)
        params = params or {}
        if job_type == DocumentJob.JobType.TRANSLATE and not params.get("target_lang"):
            raise InvalidDocumentJobError("translate requires target_lang.")
        if job_type == DocumentJob.JobType.COMPARE and not params.get("other_document_id"):
            raise InvalidDocumentJobError("compare requires other_document_id.")
        if job_type not in DocumentJob.JobType.values:
            raise InvalidDocumentJobError(f"Unknown job_type: {job_type}")

        job = DocumentJob.objects.create(
            document=doc,
            job_type=job_type,
            status=DocumentJob.Status.PENDING,
            params=params,
        )
        self._enqueue_job(job.id)
        job.refresh_from_db()
        return self._job_dto(job)

    def get_job(self, actor_id: UUID, job_id: UUID) -> DocumentJobDTO:
        job = self._get_job(job_id)
        self._require_member(actor_id, job.document.organization_id)
        return self._job_dto(job)

    def process_job(self, job_id: str | UUID) -> DocumentJobDTO:
        job = DocumentJob.objects.select_related("document").get(pk=job_id)
        job.status = DocumentJob.Status.PROCESSING
        job.error = ""
        job.save(update_fields=["status", "error", "updated_at"])
        try:
            result = self._run_job(job)
            job.result = result
            job.status = DocumentJob.Status.COMPLETED
            job.save(update_fields=["result", "status", "updated_at"])
        except Exception as exc:
            logger.exception("document_job_failed", extra={"job_id": str(job_id)})
            job.status = DocumentJob.Status.FAILED
            job.error = str(exc)[:2000]
            job.save(update_fields=["status", "error", "updated_at"])
        return self._job_dto(job)

    def _enqueue_job(self, job_id: UUID) -> None:
        from infrastructure.celery.tasks import process_document_job

        jid = str(job_id)
        if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
            self.process_job(jid)
            return
        transaction.on_commit(lambda: process_document_job.delay(jid))

    def _run_job(self, job: DocumentJob) -> dict:
        doc = job.document
        text = doc.extracted_text or f"(No extracted text for {doc.title})"
        params = job.params or {}
        job_type = job.job_type

        if job_type == DocumentJob.JobType.SUMMARIZE:
            content = complete(
                f"Summarize this document:\n\n{text[:8000]}",
                system="You summarize business documents clearly.",
            )
            return {"summary": content}

        if job_type == DocumentJob.JobType.ANALYZE:
            content = complete(
                f"Analyze structure, key entities, and risks in:\n\n{text[:8000]}",
                system="You are a document analyst.",
            )
            return {"analysis": content}

        if job_type == DocumentJob.JobType.TRANSLATE:
            lang = params.get("target_lang", "en")
            content = complete(
                f"Translate the following to {lang}:\n\n{text[:8000]}",
                system="You are a professional translator. Preserve meaning.",
            )
            return {"target_lang": lang, "translation": content}

        if job_type == DocumentJob.JobType.COMPARE:
            other_id = params["other_document_id"]
            other = StudioDocument.objects.get(pk=other_id)
            if other.organization_id != doc.organization_id:
                raise StudioDocumentNotFoundError()
            other_text = other.extracted_text or other.title
            content = complete(
                f"Compare Document A and Document B.\n\n"
                f"A ({doc.title}):\n{text[:4000]}\n\n"
                f"B ({other.title}):\n{other_text[:4000]}",
                system="Highlight similarities and differences.",
            )
            return {
                "other_document_id": str(other.id),
                "comparison": content,
            }

        if job_type == DocumentJob.JobType.EXTRACT:
            content = complete(
                f"Extract key fields, dates, amounts, and entities from:\n\n{text[:8000]}",
                system="Return structured bullet points.",
            )
            return {"extracted": content}

        if job_type == DocumentJob.JobType.OCR:
            return {
                "text": text,
                "note": "OCR/text extraction uses stored extracted_text.",
            }

        if job_type == DocumentJob.JobType.SEARCH:
            query = params.get("query", "")
            hits = []
            if query:
                lower = text.lower()
                q = query.lower()
                start = 0
                while True:
                    idx = lower.find(q, start)
                    if idx < 0:
                        break
                    snippet_start = max(0, idx - 40)
                    snippet_end = min(len(text), idx + len(query) + 40)
                    hits.append(
                        {
                            "offset": idx,
                            "snippet": text[snippet_start:snippet_end],
                        }
                    )
                    start = idx + len(query)
                    if len(hits) >= 20:
                        break
            return {"query": query, "hits": hits, "count": len(hits)}

        raise InvalidDocumentJobError(f"Unsupported job_type: {job_type}")

    def _extract_text(self, doc: StudioDocument) -> None:
        try:
            if not doc.file:
                doc.extracted_text = f"Document: {doc.title}"
                doc.status = StudioDocument.Status.READY
                doc.save(update_fields=["extracted_text", "status", "updated_at"])
                return

            with default_storage.open(doc.file.name, "rb") as fh:
                raw = fh.read()

            text = ""
            name = Path(doc.file.name).name.lower()
            if name.endswith(".csv") or name.endswith(".txt") or name.endswith(".md"):
                text = raw.decode("utf-8", errors="replace")
            elif name.endswith(".pdf"):
                try:
                    from pypdf import PdfReader

                    reader = PdfReader(io.BytesIO(raw))
                    text = "\n".join(page.extract_text() or "" for page in reader.pages)
                except Exception as exc:
                    text = f"[PDF extract failed] {doc.title}: {exc}"
            elif name.endswith(".docx"):
                try:
                    from docx import Document as DocxDocument

                    document = DocxDocument(io.BytesIO(raw))
                    text = "\n".join(p.text for p in document.paragraphs if p.text.strip())
                except Exception as exc:
                    text = f"[DOCX extract failed] {doc.title}: {exc}"
            elif name.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp")):
                try:
                    import pytesseract
                    from PIL import Image

                    text = pytesseract.image_to_string(Image.open(io.BytesIO(raw)))
                except Exception as exc:
                    text = f"[OCR unavailable] {Path(doc.file.name).name}: {exc}"
            else:
                try:
                    text = raw.decode("utf-8", errors="replace")
                except Exception:
                    text = f"[Binary file] {doc.title}"

            doc.extracted_text = (text or "").strip() or f"[Empty] {doc.title}"
            doc.status = StudioDocument.Status.READY
            doc.save(update_fields=["extracted_text", "status", "updated_at"])
        except Exception:
            logger.exception("studio_extract_failed")
            doc.status = StudioDocument.Status.FAILED
            doc.extracted_text = ""
            doc.save(update_fields=["status", "extracted_text", "updated_at"])
            raise

    @staticmethod
    def _detect_type(filename: str) -> str:
        ext = Path(filename).suffix.lstrip(".").lower()
        mapping = {
            "pdf": StudioDocument.FileType.PDF,
            "docx": StudioDocument.FileType.DOCX,
            "doc": StudioDocument.FileType.DOCX,
            "pptx": StudioDocument.FileType.PPTX,
            "xlsx": StudioDocument.FileType.XLSX,
            "csv": StudioDocument.FileType.CSV,
            "txt": StudioDocument.FileType.TEXT,
            "md": StudioDocument.FileType.TEXT,
            "png": StudioDocument.FileType.IMAGE,
            "jpg": StudioDocument.FileType.IMAGE,
            "jpeg": StudioDocument.FileType.IMAGE,
            "webp": StudioDocument.FileType.IMAGE,
            "gif": StudioDocument.FileType.IMAGE,
        }
        return mapping.get(ext, StudioDocument.FileType.OTHER)

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_document(self, document_id: UUID) -> StudioDocument:
        try:
            return StudioDocument.objects.get(pk=document_id)
        except StudioDocument.DoesNotExist as exc:
            raise StudioDocumentNotFoundError() from exc

    def _get_job(self, job_id: UUID) -> DocumentJob:
        try:
            return DocumentJob.objects.select_related("document").get(pk=job_id)
        except DocumentJob.DoesNotExist as exc:
            raise DocumentJobNotFoundError() from exc

    @staticmethod
    def _document_dto(d: StudioDocument) -> StudioDocumentDTO:
        file_url = None
        if d.file:
            try:
                file_url = d.file.url
            except Exception:
                file_url = None
        return StudioDocumentDTO(
            id=d.id,
            organization_id=d.organization_id,
            title=d.title,
            file_type=d.file_type,
            extracted_text=d.extracted_text,
            status=d.status,
            created_by_id=d.created_by_id,
            created_at=d.created_at,
            updated_at=d.updated_at,
            file_url=file_url,
        )

    @staticmethod
    def _job_dto(j: DocumentJob) -> DocumentJobDTO:
        return DocumentJobDTO(
            id=j.id,
            document_id=j.document_id,
            job_type=j.job_type,
            status=j.status,
            params=j.params or {},
            result=j.result or {},
            error=j.error,
            created_at=j.created_at,
            updated_at=j.updated_at,
        )

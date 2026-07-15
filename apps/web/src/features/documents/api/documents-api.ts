import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { isDemoMode } from "@/lib/constants";
import { withOrg, unwrapList, pickString, pickIso } from "@/lib/api/org";
import type {
  StudioDocument,
  DocumentJob,
  JobType,
  AnalyzePayload,
  SummarizePayload,
  TranslatePayload,
  ComparePayload,
  ExtractPayload,
  SearchPayload,
} from "@/features/documents/types";

function mapDocument(raw: Record<string, unknown>): StudioDocument {
  return {
    id: pickString(raw, "id"),
    name:
      pickString(raw, "name", "title") || pickString(raw, "filename", "file_name") || "Untitled",
    filename: pickString(raw, "filename", "file_name") || undefined,
    fileType: pickString(raw, "fileType", "file_type", "mime_type") || undefined,
    fileSizeBytes: Number(raw.fileSizeBytes ?? raw.file_size ?? raw.size ?? 0) || undefined,
    status: (pickString(raw, "status") || "ready") as StudioDocument["status"],
    pageCount: Number(raw.pageCount ?? raw.page_count ?? 0) || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapJob(raw: Record<string, unknown>): DocumentJob {
  let result = (raw.result as string | Record<string, unknown> | null) ?? null;
  if (result == null) {
    const content = pickString(raw, "output", "content", "summary");
    result = content || null;
  }
  return {
    id: pickString(raw, "id"),
    documentId: pickString(raw, "documentId", "document_id") || undefined,
    jobType: (pickString(raw, "jobType", "job_type", "action") || "analyze") as JobType,
    status: (pickString(raw, "status") || "pending") as DocumentJob["status"],
    result,
    error:
      (raw.error as string | null | undefined) ??
      (raw.error_message as string | null | undefined) ??
      null,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function demoDocuments(): StudioDocument[] {
  const now = Date.now();
  return [
    {
      id: "d1",
      name: "Q3 Financial Report.pdf",
      filename: "Q3_Financial_Report.pdf",
      fileType: "pdf",
      fileSizeBytes: 1_248_000,
      status: "ready",
      pageCount: 24,
      createdAt: new Date(now - 86400_000 * 3).toISOString(),
      updatedAt: new Date(now - 86400_000 * 3).toISOString(),
    },
    {
      id: "d2",
      name: "Employee Handbook 2025.docx",
      filename: "Employee_Handbook_2025.docx",
      fileType: "docx",
      fileSizeBytes: 524_000,
      status: "ready",
      pageCount: 62,
      createdAt: new Date(now - 86400_000).toISOString(),
      updatedAt: new Date(now - 86400_000).toISOString(),
    },
  ];
}

function demoJob(jobType: JobType, documentId?: string): DocumentJob {
  return {
    id: `job-${jobType}-demo`,
    documentId,
    jobType,
    status: "completed",
    result: `## ${jobType}\n\nDemo result for ${jobType}.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function createJob(
  documentId: string,
  jobType: JobType,
  params: Record<string, unknown> = {},
): Promise<DocumentJob> {
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.documents.jobs(documentId), {
    job_type: jobType,
    params,
  });
  return mapJob(raw);
}

export async function fetchDocuments(organizationId?: string | null): Promise<StudioDocument[]> {
  if (isDemoMode()) return demoDocuments();

  try {
    const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.documents.list, organizationId));
    return unwrapList(
      payload as Record<string, unknown>[] | { results?: Record<string, unknown>[] },
    ).map(mapDocument);
  } catch {
    return [];
  }
}

export async function fetchDocument(id: string): Promise<StudioDocument> {
  const payload = await api.get<Record<string, unknown>>(API_ENDPOINTS.documents.detail(id));
  return mapDocument(payload);
}

export async function uploadDocument(
  formData: FormData,
  organizationId?: string | null,
): Promise<StudioDocument> {
  if (isDemoMode()) {
    const file = formData.get("file");
    const name = file instanceof File ? file.name : `upload-${Date.now()}.bin`;
    return {
      id: `d-${Date.now()}`,
      name,
      filename: name,
      fileType: name.split(".").pop(),
      fileSizeBytes: file instanceof File ? file.size : 0,
      status: "ready",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  if (organizationId && !formData.has("organization_id")) {
    formData.append("organization_id", organizationId);
  }
  const url = withOrg(API_ENDPOINTS.documents.upload, organizationId);
  const raw = await api.post<Record<string, unknown>>(url, formData);
  return mapDocument(raw);
}

export async function analyzeDocument(payload: AnalyzePayload): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("analyze", payload.documentId);
  return createJob(payload.documentId, "analyze", {
    question: payload.question,
  });
}

export async function summarizeDocument(payload: SummarizePayload): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("summarize", payload.documentId);
  return createJob(payload.documentId, "summarize", {
    length: payload.length,
  });
}

export async function translateDocument(payload: TranslatePayload): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("translate", payload.documentId);
  return createJob(payload.documentId, "translate", {
    target_lang: payload.targetLanguage,
    target_language: payload.targetLanguage,
  });
}

export async function compareDocuments(payload: ComparePayload): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("compare");
  const primary = payload.documentIds[0];
  const other = payload.documentIds[1];
  if (!primary) throw new Error("At least one document is required to compare.");
  return createJob(primary, "compare", {
    other_document_id: other,
    document_ids: payload.documentIds,
  });
}

export async function extractDocument(payload: ExtractPayload): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("extract", payload.documentId);
  return createJob(payload.documentId, "extract", {
    fields: payload.fields,
  });
}

export async function ocrDocument(documentId: string): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("ocr", documentId);
  return createJob(documentId, "ocr");
}

export async function searchDocuments(payload: SearchPayload): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("search");
  // Search runs against the first selected/recent document context via jobs API
  // when a documentId is provided on the payload through organization flow.
  const body: Record<string, unknown> = { query: payload.query };
  if (payload.organizationId) body.organization_id = payload.organizationId;

  // Prefer job on a pseudo path if frontend selected a doc — hooks pass document via store.
  // Fall back to list endpoint behavior by creating job on list's first doc is handled in UI.
  throw new Error("Select a document, then run Search — search is document-scoped via jobs.");
}

export async function searchDocument(documentId: string, query: string): Promise<DocumentJob> {
  if (isDemoMode()) return demoJob("search", documentId);
  return createJob(documentId, "search", { query });
}

export async function fetchJobs(_organizationId?: string | null): Promise<DocumentJob[]> {
  if (isDemoMode()) return [];
  // Backend lists jobs per-document; UI tracks active job via store/detail poll.
  return [];
}

export async function fetchJob(id: string): Promise<DocumentJob> {
  const raw = await api.get<Record<string, unknown>>(API_ENDPOINTS.documents.job(id));
  return mapJob(raw);
}

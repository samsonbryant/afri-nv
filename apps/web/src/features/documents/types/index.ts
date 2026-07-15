export type StudioDocument = {
  id: string;
  name: string;
  filename?: string;
  fileType?: string;
  fileSizeBytes?: number;
  status: "uploaded" | "processing" | "ready" | "failed";
  pageCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type JobType =
  "analyze" | "summarize" | "translate" | "compare" | "extract" | "ocr" | "search";

export type DocumentJob = {
  id: string;
  documentId?: string;
  jobType: JobType;
  status: "pending" | "running" | "completed" | "failed";
  result?: string | Record<string, unknown> | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnalyzePayload = {
  documentId: string;
  question?: string;
};

export type SummarizePayload = {
  documentId: string;
  length?: "short" | "medium" | "long";
};

export type TranslatePayload = {
  documentId: string;
  targetLanguage: string;
};

export type ComparePayload = {
  documentIds: string[];
  organizationId?: string | null;
};

export type ExtractPayload = {
  documentId: string;
  fields?: string[];
};

export type SearchPayload = {
  query: string;
  organizationId?: string | null;
};

export const DOCUMENT_ACTIONS: { action: JobType; label: string }[] = [
  { action: "analyze", label: "Analyze" },
  { action: "summarize", label: "Summarize" },
  { action: "translate", label: "Translate" },
  { action: "compare", label: "Compare" },
  { action: "extract", label: "Extract" },
  { action: "ocr", label: "OCR" },
  { action: "search", label: "Search" },
];

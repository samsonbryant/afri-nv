"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchDocuments,
  uploadDocument,
  analyzeDocument,
  summarizeDocument,
  translateDocument,
  compareDocuments,
  extractDocument,
  ocrDocument,
  searchDocument,
  fetchJobs,
} from "@/features/documents/api/documents-api";
import type { SummarizePayload, DocumentJob, JobType } from "@/features/documents/types";
import { useActiveOrganizationId } from "@/features/organizations/hooks/use-organizations";
import { getErrorMessage } from "@/lib/api/errors";
import { useDocumentsStore } from "@/features/documents/stores/documents-store";

export const documentKeys = {
  all: ["documents"] as const,
  lists: (orgId?: string | null) => [...documentKeys.all, "list", orgId ?? "none"] as const,
  jobs: (orgId?: string | null) => [...documentKeys.all, "jobs", orgId ?? "none"] as const,
};

export function useDocuments() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: documentKeys.lists(orgId),
    queryFn: () => fetchDocuments(orgId),
  });
}

export function useDocumentJobs() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: documentKeys.jobs(orgId),
    queryFn: () => fetchJobs(orgId),
  });
}

export function useUploadDocument() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  const setSelectedDocumentId = useDocumentsStore((s) => s.setSelectedDocumentId);

  return useMutation({
    mutationFn: (formData: FormData) => uploadDocument(formData, orgId),
    onSuccess: (doc) => {
      toast.success("Document uploaded");
      setSelectedDocumentId(doc.id);
      void queryClient.invalidateQueries({
        queryKey: documentKeys.lists(orgId),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDocumentAction() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  const setActiveJob = useDocumentsStore((s) => s.setActiveJob);

  return useMutation({
    mutationFn: async ({
      action,
      documentId,
      extra,
    }: {
      action: JobType;
      documentId: string;
      extra?: Record<string, unknown>;
    }): Promise<DocumentJob> => {
      switch (action) {
        case "analyze":
          return analyzeDocument({
            documentId,
            question: extra?.question as string | undefined,
          });
        case "summarize":
          return summarizeDocument({
            documentId,
            length: extra?.length as SummarizePayload["length"],
          });
        case "translate":
          return translateDocument({
            documentId,
            targetLanguage: (extra?.targetLanguage as string) || "es",
          });
        case "extract":
          return extractDocument({ documentId });
        case "ocr":
          return ocrDocument(documentId);
        case "compare":
          return compareDocuments({
            documentIds: (extra?.documentIds as string[]) || [documentId],
            organizationId: orgId,
          });
        case "search":
          return searchDocument(documentId, (extra?.query as string) || "key points");
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    },
    onSuccess: (job) => {
      toast.success("Job completed");
      setActiveJob(job);
      void queryClient.invalidateQueries({ queryKey: documentKeys.jobs(orgId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

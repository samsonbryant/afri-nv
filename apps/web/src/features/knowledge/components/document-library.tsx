"use client";

import { FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useDeleteKnowledgeDocument,
  useKnowledgeDocuments,
} from "@/features/knowledge/hooks/use-knowledge";
import { useKnowledgeStore } from "@/features/knowledge/stores/knowledge-store";
import type { KnowledgeDocStatus } from "@/features/knowledge/types";
import { formatRelative } from "@/lib/utils/format";

const statusVariant: Record<
  KnowledgeDocStatus,
  "secondary" | "warning" | "success" | "destructive"
> = {
  pending: "secondary",
  processing: "warning",
  ready: "success",
  failed: "destructive",
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentLibrary() {
  const { data, isLoading, isError, refetch } = useKnowledgeDocuments();
  const selectedDocumentId = useKnowledgeStore((s) => s.selectedDocumentId);
  const setSelectedDocumentId = useKnowledgeStore((s) => s.setSelectedDocumentId);
  const remove = useDeleteKnowledgeDocument();

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading documents">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={FileText}
        title="Couldn’t load documents"
        description="Check your connection and try again."
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload PDFs, decks, spreadsheets, or images to build your knowledge base."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {data.map((doc) => {
        const selected = doc.id === selectedDocumentId;
        return (
          <li key={doc.id}>
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent/30"
              }`}
            >
              <button
                type="button"
                className="focus-visible:ring-ring min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2"
                onClick={() => setSelectedDocumentId(doc.id)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="text-primary h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate font-medium">{doc.title}</span>
                  <Badge variant={statusVariant[doc.status]}>{doc.status}</Badge>
                </div>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  {doc.filename} · {formatBytes(doc.size)}
                  {doc.chunkCount != null ? ` · ${doc.chunkCount} chunks` : ""}
                  {" · "}
                  {formatRelative(doc.updatedAt)}
                </p>
                {doc.errorMessage ? (
                  <p className="text-destructive mt-1 text-xs">{doc.errorMessage}</p>
                ) : null}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={`Delete ${doc.title}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate(doc.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

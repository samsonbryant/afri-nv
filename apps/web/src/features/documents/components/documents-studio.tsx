"use client";

import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { FileStack, Loader2, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  useDocumentAction,
  useDocuments,
  useUploadDocument,
} from "@/features/documents/hooks/use-documents";
import { useDocumentsStore } from "@/features/documents/stores/documents-store";
import { DOCUMENT_ACTIONS, type JobType } from "@/features/documents/types";
import { cn } from "@/lib/utils/cn";
import { formatRelative } from "@/lib/utils/format";
import { toast } from "sonner";

function formatBytes(size?: number): string {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function JobResultPanel({
  result,
  isLoading,
}: {
  result?: string | Record<string, unknown> | null;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (result == null || result === "") {
    return (
      <EmptyState
        icon={FileStack}
        title="No job result yet"
        description="Run an action on a document to see markdown or JSON output here."
        className="py-12"
      />
    );
  }

  const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
  const looksJson =
    typeof result === "object" || (typeof result === "string" && text.trim().startsWith("{"));

  if (looksJson && typeof result === "object") {
    return (
      <pre className="border-border overflow-x-auto rounded-xl border bg-slate-950 p-4 text-xs text-slate-50">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }

  if (looksJson && typeof result === "string") {
    try {
      const parsed = JSON.parse(result);
      return (
        <pre className="border-border overflow-x-auto rounded-xl border bg-slate-950 p-4 text-xs text-slate-50">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      // fall through to markdown
    }
  }

  return (
    <div className="border-border bg-card rounded-xl border p-4 md:p-6">
      <div className="markdown-body [&_h2]:font-display [&_td]:border-border [&_th]:border-border space-y-3 text-sm [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-5">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export function DocumentsStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const selectedDocumentId = useDocumentsStore((s) => s.selectedDocumentId);
  const setSelectedDocumentId = useDocumentsStore((s) => s.setSelectedDocumentId);
  const activeJob = useDocumentsStore((s) => s.activeJob);
  const searchQuery = useDocumentsStore((s) => s.searchQuery);
  const setSearchQuery = useDocumentsStore((s) => s.setSearchQuery);
  const translateLanguage = useDocumentsStore((s) => s.translateLanguage);
  const setTranslateLanguage = useDocumentsStore((s) => s.setTranslateLanguage);
  const compareDocumentId = useDocumentsStore((s) => s.compareDocumentId);
  const setCompareDocumentId = useDocumentsStore((s) => s.setCompareDocumentId);

  const { data: documents = [], isLoading, isError, refetch } = useDocuments();
  const upload = useUploadDocument();
  const runAction = useDocumentAction();

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        await upload.mutateAsync(form);
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [upload],
  );

  function onAction(action: JobType) {
    if (!selectedDocumentId) {
      toast.message("Select a document first");
      return;
    }
    if (action === "translate") {
      runAction.mutate({
        action,
        documentId: selectedDocumentId,
        extra: { targetLanguage: translateLanguage },
      });
      return;
    }
    if (action === "compare") {
      if (!compareDocumentId) {
        toast.message("Choose a document to compare against");
        return;
      }
      runAction.mutate({
        action,
        documentId: selectedDocumentId,
        extra: { documentIds: [selectedDocumentId, compareDocumentId] },
      });
      return;
    }
    if (action === "search") {
      if (!searchQuery.trim()) {
        toast.message("Enter a search query");
        return;
      }
      runAction.mutate({
        action,
        documentId: selectedDocumentId,
        extra: { query: searchQuery.trim() },
      });
      return;
    }
    runAction.mutate({ action, documentId: selectedDocumentId });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents Studio"
        description="Upload files and run analyze, summarize, translate, compare, extract, OCR, or search."
      />

      <div
        role="button"
        tabIndex={0}
        className={cn(
          "border-border bg-muted/30 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {upload.isPending ? (
          <Loader2 className="text-primary mb-3 h-8 w-8 animate-spin" />
        ) : (
          <UploadCloud className="text-primary mb-3 h-8 w-8" />
        )}
        <p className="text-sm font-medium">Drop files or click to upload</p>
        <p className="text-muted-foreground mt-1 text-xs">PDFs, office docs, images, and more</p>
      </div>

      {isError ? (
        <EmptyState
          icon={FileStack}
          title="Couldn’t load documents"
          description="Try again shortly."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Documents
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={FileStack}
              title="No documents"
              description="Upload a file to get started."
              className="py-10"
            />
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => {
                const active = doc.id === selectedDocumentId;
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                      )}
                      onClick={() => setSelectedDocumentId(doc.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{doc.name}</p>
                        <Badge variant="outline">{doc.status}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {doc.filename ?? doc.name} · {formatBytes(doc.fileSizeBytes)} ·{" "}
                        {formatRelative(doc.updatedAt)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-border space-y-3 rounded-xl border p-4">
            <h3 className="text-sm font-medium">Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="translate-lang">Translate language</Label>
                <Select
                  id="translate-lang"
                  value={translateLanguage}
                  onChange={(e) => setTranslateLanguage(e.target.value)}
                >
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="ar">Arabic</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compare-doc">Compare with</Label>
                <Select
                  id="compare-doc"
                  value={compareDocumentId}
                  onChange={(e) => setCompareDocumentId(e.target.value)}
                >
                  <option value="">Select…</option>
                  {documents
                    .filter((d) => d.id !== selectedDocumentId)
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-search">Search query</Label>
              <Input
                id="doc-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find clauses, amounts…"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_ACTIONS.map(({ action, label }) => (
                <Button
                  key={action}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={runAction.isPending || !selectedDocumentId}
                  onClick={() => onAction(action)}
                >
                  {runAction.isPending && runAction.variables?.action === action ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Job result
          </h2>
          <JobResultPanel result={activeJob?.result} isLoading={runAction.isPending} />
        </div>
      </div>
    </div>
  );
}

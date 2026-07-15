"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDocumentChunks, useKnowledgeDocuments } from "@/features/knowledge/hooks/use-knowledge";
import { useKnowledgeStore } from "@/features/knowledge/stores/knowledge-store";

export function DocumentDetailDrawer() {
  const selectedDocumentId = useKnowledgeStore((s) => s.selectedDocumentId);
  const setSelectedDocumentId = useKnowledgeStore((s) => s.setSelectedDocumentId);
  const { data: documents } = useKnowledgeDocuments();
  const { data: chunks, isLoading } = useDocumentChunks(selectedDocumentId);

  const document = documents?.find((d) => d.id === selectedDocumentId);

  return (
    <Sheet
      open={Boolean(selectedDocumentId)}
      onOpenChange={(open) => {
        if (!open) setSelectedDocumentId(null);
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{document?.title ?? "Document"}</SheetTitle>
          <SheetDescription>
            {document
              ? `${document.filename} · ${document.status}`
              : "View indexed chunks from this document."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <h3 className="text-foreground text-sm font-medium">Chunks</h3>
          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : null}
          {!isLoading && (!chunks || chunks.length === 0) ? (
            <p className="text-muted-foreground text-sm">
              No chunks available yet. Processing may still be running.
            </p>
          ) : null}
          {!isLoading && chunks && chunks.length > 0 ? (
            <ul className="space-y-2">
              {chunks.map((chunk) => (
                <li
                  key={chunk.id}
                  className="border-border bg-muted/30 rounded-lg border p-3 text-sm"
                >
                  <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                    Chunk {chunk.index + 1}
                    {chunk.tokenCount != null ? ` · ${chunk.tokenCount} tokens` : ""}
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{chunk.content}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import type { AssistantCitation } from "@/features/assistant/types";

type CitationListProps = {
  citations: AssistantCitation[];
};

export function CitationList({ citations }: CitationListProps) {
  if (!citations.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Sources</p>
      <ul className="space-y-2">
        {citations.map((citation, index) => (
          <li
            key={citation.id || `${index}-${citation.title}`}
            className="border-border bg-muted/40 rounded-md border px-3 py-2 text-sm"
          >
            {citation.url ? (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary focus-visible:ring-ring font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2"
              >
                {citation.title}
              </a>
            ) : (
              <span className="font-medium">{citation.title}</span>
            )}
            {citation.snippet ? (
              <p className="text-muted-foreground mt-1 text-xs">{citation.snippet}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

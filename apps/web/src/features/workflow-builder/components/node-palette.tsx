"use client";

import { NODE_PALETTE } from "@/features/workflow-builder/types";
import type { PaletteItem } from "@/features/workflow-builder/types";

type NodePaletteProps = {
  onAdd: (item: PaletteItem) => void;
};

export function NodePalette({ onAdd }: NodePaletteProps) {
  const groups = ["trigger", "condition", "action"] as const;

  return (
    <aside className="border-border bg-card flex w-56 shrink-0 flex-col gap-4 border-r p-3">
      <div>
        <h2 className="text-sm font-semibold">Node palette</h2>
        <p className="text-muted-foreground text-xs">Click to add a node to the canvas</p>
      </div>
      {groups.map((kind) => (
        <div key={kind} className="space-y-2">
          <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
            {kind}s
          </p>
          <div className="space-y-1.5">
            {NODE_PALETTE.filter((item) => item.kind === kind).map((item) => (
              <button
                key={`${item.kind}-${item.subtype}`}
                type="button"
                onClick={() => onAdd(item)}
                className="border-border bg-background hover:bg-accent w-full rounded-md border px-2.5 py-2 text-left transition-colors"
              >
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-muted-foreground line-clamp-2 text-[11px]">{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

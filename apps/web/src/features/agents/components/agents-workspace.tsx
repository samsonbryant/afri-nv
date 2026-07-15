"use client";

import {
  Bot,
  Briefcase,
  Landmark,
  Scale,
  Search,
  Headphones,
  Megaphone,
  Users,
  Crown,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAgentCatalog,
  useAgentRuns,
  useAgents,
  useCreateAgent,
  useRunAgent,
} from "@/features/agents/hooks/use-agents";
import { useAgentsStore } from "@/features/agents/stores/agents-store";
import type { AgentCategory } from "@/features/agents/types";
import { AGENT_CATEGORY_LABELS } from "@/features/agents/types";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const categoryIcons: Record<AgentCategory, typeof Bot> = {
  sales: Briefcase,
  marketing: Megaphone,
  hr: Users,
  finance: Landmark,
  legal: Scale,
  research: Search,
  support: Headphones,
  executive: Crown,
};

export function AgentsWorkspace() {
  const { data: catalog = [], isLoading: catalogLoading } = useAgentCatalog();
  const { data: agents = [] } = useAgents();
  const createAgent = useCreateAgent();
  const { selectedAgentId, setSelectedAgentId, prompt, setPrompt } = useAgentsStore();

  const selected =
    agents.find((a) => a.id === selectedAgentId) ??
    agents.find((a) => a.category === selectedAgentId?.replace("agent-", "")) ??
    null;

  // Backend agent routes require a UUID — never call /agents/agent-sales/...
  const effectiveId = selected?.id ?? null;

  const { data: runs = [], isLoading: runsLoading } = useAgentRuns(effectiveId);
  const runAgent = useRunAgent(effectiveId);

  return (
    <div>
      <PageHeader
        title="Agents"
        description="Specialized AI agents for sales, marketing, HR, finance, and more."
      />

      {catalogLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-busy>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.map((item) => {
            const Icon = categoryIcons[item.category] ?? Bot;
            const existing = agents.find((a) => a.category === item.category);
            const active =
              selectedAgentId === existing?.id ||
              selectedAgentId === `agent-${item.category}` ||
              selected?.category === item.category;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (existing) {
                    setSelectedAgentId(existing.id);
                    return;
                  }
                  // createAgent sets the real UUID on success
                  createAgent.mutate(item.category);
                }}
                className={cn(
                  "border-border bg-card hover:bg-accent/40 rounded-xl border p-4 text-left transition-colors",
                  active && "border-primary bg-primary/5",
                )}
              >
                <div className="bg-primary/10 text-primary mb-3 flex h-9 w-9 items-center justify-center rounded-lg">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="border-border bg-card space-y-4 rounded-xl border p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">
              {selected ? selected.name : "Select an agent"}
            </h2>
            {selected ? (
              <Badge variant="secondary">{AGENT_CATEGORY_LABELS[selected.category]}</Badge>
            ) : null}
          </div>
          {!selected && !effectiveId ? (
            <EmptyState
              icon={Bot}
              title="No agent selected"
              description="Choose a catalog agent to open the run panel."
              className="py-10"
            />
          ) : (
            <>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask the agent to draft, research, or take action…"
                rows={5}
              />
              <Button
                disabled={!prompt.trim() || runAgent.isPending || !effectiveId}
                onClick={() => {
                  runAgent.mutate({ prompt: prompt.trim() }, { onSuccess: () => setPrompt("") });
                }}
              >
                Run agent
              </Button>
              {runs[0]?.response ? (
                <div className="border-border bg-muted/30 rounded-lg border p-4">
                  <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                    Latest response
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{runs[0].response}</pre>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="border-border bg-card space-y-4 rounded-xl border p-5">
          <h2 className="font-display text-lg font-semibold">Run history</h2>
          {runsLoading ? (
            <div className="space-y-2" aria-busy>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : null}
          {!runsLoading && runs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No runs yet for this agent.</p>
          ) : null}
          <ul className="space-y-2">
            {runs.map((run, index) => (
              <li
                key={run.id || `run-${index}`}
                className="border-border rounded-lg border px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      run.status === "succeeded"
                        ? "success"
                        : run.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {run.status}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {formatRelative(run.createdAt)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{run.prompt}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

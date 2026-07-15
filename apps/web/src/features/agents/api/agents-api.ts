import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  Agent,
  AgentCatalogItem,
  AgentCategory,
  AgentRun,
  RunAgentInput,
} from "@/features/agents/types";
import { AGENT_CATEGORY_LABELS } from "@/features/agents/types";

const now = Date.now();

const DEMO_CATALOG: AgentCatalogItem[] = (
  Object.keys(AGENT_CATEGORY_LABELS) as AgentCategory[]
).map((category) => ({
  id: `catalog-${category}`,
  category,
  name: `${AGENT_CATEGORY_LABELS[category]} agent`,
  description: `Specialized ${AGENT_CATEGORY_LABELS[category].toLowerCase()} workflows, research, and recommendations.`,
  capabilities: ["Chat", "Summarize", "Draft actions", "Run playbooks"],
}));

let demoAgents: Agent[] = DEMO_CATALOG.map((item, index) => ({
  id: `agent-${item.category}`,
  name: item.name,
  category: item.category,
  description: item.description,
  status: index === 0 ? "ready" : "ready",
  createdAt: new Date(now - 86400000 * (index + 1)).toISOString(),
  updatedAt: new Date(now - 3600000 * index).toISOString(),
}));

let demoRuns: AgentRun[] = [
  {
    id: "run-1",
    agentId: "agent-sales",
    prompt: "Draft a follow-up email for a stalled opportunity",
    response:
      "Subject: Quick check-in on next steps\n\nHi {{name}},\n\nWanted to follow up on our last conversation…",
    status: "succeeded",
    createdAt: new Date(now - 7200000).toISOString(),
    finishedAt: new Date(now - 7190000).toISOString(),
  },
];

function mapCategory(value: unknown): AgentCategory {
  const v = String(value ?? "support").toLowerCase();
  return (v in AGENT_CATEGORY_LABELS ? v : "support") as AgentCategory;
}

function mapAgent(raw: Record<string, unknown>, index = 0): Agent {
  const statusRaw = pickString(raw, "status") || "ready";
  const status =
    statusRaw === "running" ||
    statusRaw === "paused" ||
    statusRaw === "error" ||
    statusRaw === "ready"
      ? statusRaw
      : "ready";
  const id = String(raw.id ?? "").trim() || `agent-${index}`;
  return {
    id,
    name: pickString(raw, "name", "title") || "Agent",
    category: mapCategory(raw.category ?? raw.type),
    description: pickString(raw, "description") || "",
    status,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapCatalogItem(raw: Record<string, unknown>): AgentCatalogItem {
  const category = mapCategory(raw.category ?? raw.type ?? raw.id);
  const id = String(raw.id ?? raw.type ?? category).trim() || category;
  return {
    id,
    category,
    name: pickString(raw, "name", "title") || `${AGENT_CATEGORY_LABELS[category]} agent`,
    description: pickString(raw, "description") || "",
    capabilities: Array.isArray(raw.capabilities) ? raw.capabilities.map(String) : ["Chat", "Run"],
  };
}

function mapRun(raw: Record<string, unknown>, index = 0): AgentRun {
  const statusRaw = pickString(raw, "status") || "pending";
  const status =
    statusRaw === "running" ||
    statusRaw === "succeeded" ||
    statusRaw === "failed" ||
    statusRaw === "pending"
      ? statusRaw
      : "pending";
  const id = String(raw.id ?? "").trim() || `run-${index}`;
  return {
    id,
    agentId: pickString(raw, "agentId", "agent_id"),
    prompt: pickString(raw, "prompt", "input", "message"),
    response:
      (raw.response as string | null | undefined) ??
      (raw.output as string | null | undefined) ??
      null,
    status,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    finishedAt:
      (raw.finishedAt as string | null | undefined) ??
      (raw.finished_at as string | null | undefined) ??
      (raw.updated_at as string | null | undefined) ??
      null,
  };
}

export async function fetchAgentCatalog(
  organizationId?: string | null,
): Promise<AgentCatalogItem[]> {
  if (isDemoMode()) return DEMO_CATALOG;
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.agents.catalog, organizationId));
    const items = unwrapList(payload).map(mapCatalogItem);
    return items.length > 0 ? items : DEMO_CATALOG;
  } catch {
    return DEMO_CATALOG;
  }
}

export async function fetchAgents(organizationId?: string | null): Promise<Agent[]> {
  if (isDemoMode()) return [...demoAgents];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.agents.list, organizationId));
    return unwrapList(payload).map(mapAgent);
  } catch {
    return [];
  }
}

export async function fetchAgent(
  id: string,
  organizationId?: string | null,
): Promise<Agent | null> {
  if (isDemoMode()) {
    return demoAgents.find((a) => a.id === id) ?? null;
  }
  try {
    const payload = await api.get<Record<string, unknown>>(
      withOrg(API_ENDPOINTS.agents.detail(id), organizationId),
    );
    return mapAgent(payload);
  } catch {
    return null;
  }
}

export async function createAgentFromCatalog(
  category: AgentCategory,
  organizationId?: string | null,
): Promise<Agent> {
  const catalog = DEMO_CATALOG.find((c) => c.category === category);
  if (isDemoMode()) {
    const existing = demoAgents.find((a) => a.category === category);
    if (existing) return existing;
    const agent: Agent = {
      id: `agent-${category}`,
      name: catalog?.name ?? `${AGENT_CATEGORY_LABELS[category]} agent`,
      category,
      description: catalog?.description ?? "",
      status: "ready",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoAgents = [agent, ...demoAgents];
    return agent;
  }

  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.agents.create, organizationId),
    {
      type: category,
      name: catalog?.name,
      description: catalog?.description,
      organization_id: organizationId,
    },
  );
  return mapAgent(payload);
}

export async function fetchAgentRuns(
  agentId: string,
  organizationId?: string | null,
): Promise<AgentRun[]> {
  if (isDemoMode()) {
    return demoRuns.filter((r) => r.agentId === agentId);
  }
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.agents.runs(agentId), organizationId));
    return unwrapList(payload).map(mapRun);
  } catch {
    return [];
  }
}

export async function runAgent(
  agentId: string,
  input: RunAgentInput,
  organizationId?: string | null,
): Promise<AgentRun> {
  if (isDemoMode()) {
    const run: AgentRun = {
      id: `run-${Date.now()}`,
      agentId,
      prompt: input.prompt,
      response: `Here's a drafted response for your ${agentId.replace("agent-", "")} request:\n\n${input.prompt}\n\n— Novixa agent`,
      status: "succeeded",
      createdAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
    demoRuns = [run, ...demoRuns];
    return run;
  }

  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.agents.run(agentId), organizationId),
    {
      message: input.prompt,
      context: {},
    },
  );
  return mapRun(payload);
}

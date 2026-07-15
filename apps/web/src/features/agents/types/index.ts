export type AgentCategory =
  "sales" | "marketing" | "hr" | "finance" | "legal" | "research" | "support" | "executive";

export const AGENT_CATEGORY_LABELS: Record<AgentCategory, string> = {
  sales: "Sales",
  marketing: "Marketing",
  hr: "HR",
  finance: "Finance",
  legal: "Legal",
  research: "Research",
  support: "Support",
  executive: "Executive",
};

export type AgentCatalogItem = {
  id: string;
  category: AgentCategory;
  name: string;
  description: string;
  capabilities: string[];
};

export type Agent = {
  id: string;
  category: AgentCategory;
  name: string;
  description?: string;
  status: "ready" | "running" | "paused" | "error";
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: string;
  agentId: string;
  prompt: string;
  response?: string | null;
  status: "pending" | "running" | "succeeded" | "failed";
  createdAt: string;
  finishedAt?: string | null;
};

export type RunAgentInput = {
  prompt: string;
};

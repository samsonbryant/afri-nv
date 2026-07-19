export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Novixa";

export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "AI Business Operating System";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Ensure API base always includes the Django `/api/v1` prefix. */
export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "http://localhost:8000/api/v1";
  if (/\/api\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api/v1`;
}

export const API_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
);

/**
 * Demo / offline fixtures. Keep false for production and local API testing.
 * Set NEXT_PUBLIC_DEMO_MODE=true only for UI demos without a backend.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

/** Bumped when JWT signing secrets change so stale browser sessions are discarded. */
export const AUTH_STORAGE_KEY = "novixa-auth-v2";
export const UI_STORAGE_KEY = "novixa-ui";
export const ORG_STORAGE_KEY = "novixa-active-org";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  twoFactor: "/two-factor",
  onboarding: "/onboarding",
  invite: "/invite",
  dashboard: "/dashboard",
  workflows: "/workflows",
  workflowBuilder: (id: string) => `/workflows/${id}`,
  automations: "/automations",
  assistant: "/assistant",
  knowledge: "/knowledge",
  crm: "/crm",
  support: "/support",
  marketing: "/marketing",
  documents: "/documents",
  reports: "/reports",
  meetings: "/meetings",
  agents: "/agents",
  billing: "/billing",
  analytics: "/analytics",
  security: "/security",
  developer: "/developer",
  admin: "/admin",
  settings: "/settings",
} as const;

export const NAV_ITEMS = [
  { title: "Admin", href: ROUTES.admin, icon: "ShieldCheck", staffOnly: true },
  { title: "Dashboard", href: ROUTES.dashboard, icon: "LayoutDashboard" },
  { title: "Assistant", href: ROUTES.assistant, icon: "Sparkles" },
  { title: "Workflows", href: ROUTES.workflows, icon: "GitBranch" },
  { title: "Automations", href: ROUTES.automations, icon: "Zap" },
  { title: "Knowledge", href: ROUTES.knowledge, icon: "BookOpen" },
  { title: "CRM", href: ROUTES.crm, icon: "Users" },
  { title: "Support", href: ROUTES.support, icon: "LifeBuoy" },
  { title: "Marketing", href: ROUTES.marketing, icon: "Megaphone" },
  { title: "Documents", href: ROUTES.documents, icon: "FileText" },
  { title: "Reports", href: ROUTES.reports, icon: "BarChart3" },
  { title: "Meetings", href: ROUTES.meetings, icon: "Video" },
  { title: "Agents", href: ROUTES.agents, icon: "Bot" },
  { title: "Billing", href: ROUTES.billing, icon: "CreditCard" },
  { title: "Analytics", href: ROUTES.analytics, icon: "LineChart" },
  { title: "Security", href: ROUTES.security, icon: "Shield" },
  { title: "Developer", href: ROUTES.developer, icon: "Code2" },
  { title: "Settings", href: ROUTES.settings, icon: "Settings" },
] as const;

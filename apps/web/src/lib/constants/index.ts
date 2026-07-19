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

/**
 * Browser-facing API base.
 *
 * On some Liberian ISPs (notably Orange GSM) Render hosts are unreachable while
 * Vercel works. Prefer the same-origin `/api/v1` proxy whenever the configured
 * API points at Render, or when NEXT_PUBLIC_USE_API_PROXY=true.
 */
export function resolvePublicApiUrl(raw?: string): string {
  const value = (raw ?? process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  const forceProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";
  const disableProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "false";

  if (!value) {
    return forceProxy ? "/api/v1" : "http://localhost:8000/api/v1";
  }
  if (value.startsWith("/")) {
    return normalizeApiBaseUrl(value);
  }
  if (forceProxy) {
    return "/api/v1";
  }
  // Auto-proxy Render URLs so Orange/Lonestar users never hit onrender.com
  if (!disableProxy && /onrender\.com/i.test(value)) {
    return "/api/v1";
  }
  return normalizeApiBaseUrl(value);
}

export const API_URL = resolvePublicApiUrl();

/**
 * Demo / offline fixtures. Keep false for production and local API testing.
 * Set NEXT_PUBLIC_DEMO_MODE=true only for UI demos without a backend.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

/**
 * Rewrite absolute backend asset URLs (e.g. avatars on Render) to same-origin
 * paths so media loads through the Vercel proxy on restricted ISPs.
 */
export function toSameOriginAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/media/") || /onrender\.com$/i.test(parsed.hostname)) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }
  return url;
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

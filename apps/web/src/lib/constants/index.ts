export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Novixa";

export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "AI Business Operating System";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const AUTH_STORAGE_KEY = "novixa-auth";
export const UI_STORAGE_KEY = "novixa-ui";

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  workflows: "/workflows",
  automations: "/automations",
  settings: "/settings",
} as const;

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: ROUTES.dashboard,
    icon: "LayoutDashboard",
  },
  {
    title: "Workflows",
    href: ROUTES.workflows,
    icon: "GitBranch",
  },
  {
    title: "Automations",
    href: ROUTES.automations,
    icon: "Zap",
  },
  {
    title: "Settings",
    href: ROUTES.settings,
    icon: "Settings",
  },
] as const;

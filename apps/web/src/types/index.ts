export type {
  PaginatedResponse,
  ApiMessage,
  User,
  Organization,
  AuthTokens,
  AuthResponse,
  Workflow,
  Automation,
  DashboardStats,
  ActivityItem,
} from "./api";

export type ThemeMode = "light" | "dark" | "system";

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  disabled?: boolean;
};

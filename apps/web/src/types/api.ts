export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiMessage = {
  detail?: string;
  message?: string;
  code?: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role?: "owner" | "admin" | "member";
  createdAt: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type AuthResponse = {
  user: User;
  organization: Organization | null;
  tokens: AuthTokens;
};

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
};

export type OrganizationMember = {
  id: string;
  userId: string;
  email?: string;
  fullName: string;
  role: string;
};

export type Workflow = {
  id: string;
  name: string;
  description?: string | null;
  status: "draft" | "active" | "paused" | "archived";
  updatedAt: string;
  createdAt: string;
  runCount?: number;
};

export type Automation = {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  triggerType: string;
  updatedAt: string;
  createdAt: string;
  lastRunAt?: string | null;
};

export type DashboardStats = {
  workflowsActive: number;
  automationsRunning: number;
  runsToday: number;
  successRate: number;
};

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
};

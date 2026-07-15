export type AdminTab =
  "users" | "organizations" | "subscriptions" | "payments" | "ai-usage" | "audit-logs" | "settings";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  isStaff: boolean;
  isActive: boolean;
  createdAt: string;
};

export type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  membersCount: number;
  createdAt: string;
};

export type AdminSubscription = {
  id: string;
  organizationName: string;
  plan: string;
  status: string;
  mrr: number;
  currentPeriodEnd: string;
};

export type AdminPayment = {
  id: string;
  organizationName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminAiUsage = {
  id: string;
  organizationName: string;
  tokens: number;
  requests: number;
  cost: number;
  period: string;
};

export type AdminAuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  ipAddress?: string;
  createdAt: string;
};

export type AdminPlatformSettings = {
  maintenanceMode: boolean;
  signupEnabled: boolean;
  defaultPlan: string;
};

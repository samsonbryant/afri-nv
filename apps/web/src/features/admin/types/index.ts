export type AdminTab =
  | "overview"
  | "users"
  | "organizations"
  | "subscriptions"
  | "payments"
  | "ai-usage"
  | "audit-logs"
  | "settings";

export type AdminManualPayment = {
  id: string;
  organizationName: string;
  planName: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  reference: string;
  payerPhone: string;
  transactionId: string;
  requestedByEmail?: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isStaff: boolean;
  isSuperuser: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
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

export type AdminOverview = {
  users: number;
  organizations: number;
  activeSubscriptions: number;
  staffUsers: number;
  mrrCents: number;
  revenueCents: number;
  aiTokens: number;
};

export type CreateAdminUserInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isStaff?: boolean;
  isSuperuser?: boolean;
  isActive?: boolean;
};

export type UpdateAdminUserInput = {
  firstName?: string;
  lastName?: string;
  isStaff?: boolean;
  isSuperuser?: boolean;
  isActive?: boolean;
  password?: string;
};

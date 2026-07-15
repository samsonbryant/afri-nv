export type SecurityStatusItem = {
  id: string;
  label: string;
  status: "ok" | "warning" | "error" | "unknown";
  detail: string;
};

export type SecurityAuditLog = {
  id: string;
  actor: string;
  action: string;
  target?: string;
  ip?: string;
  createdAt: string;
};

export type SecurityOverview = {
  status: SecurityStatusItem[];
  auditLogs: SecurityAuditLog[];
};

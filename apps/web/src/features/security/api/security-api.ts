import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  SecurityAuditLog,
  SecurityOverview,
  SecurityStatusItem,
} from "@/features/security/types";

function demoOverview(): SecurityOverview {
  const now = Date.now();
  return {
    status: [
      {
        id: "encryption",
        label: "Encryption",
        status: "ok",
        detail: "TLS 1.3 in transit · AES-256 at rest",
      },
      {
        id: "rate-limit",
        label: "Rate limiting",
        status: "ok",
        detail: "API rate limits active",
      },
      {
        id: "sentry",
        label: "Sentry",
        status: "ok",
        detail: "Error monitoring connected",
      },
      {
        id: "backups",
        label: "Backups",
        status: "ok",
        detail: "Last backup completed 3 hours ago",
      },
    ],
    auditLogs: [
      {
        id: "a1",
        actor: "you@company.com",
        action: "settings.updated",
        target: "preferences",
        ip: "203.0.113.10",
        createdAt: new Date(now - 3600000).toISOString(),
      },
      {
        id: "a2",
        actor: "you@company.com",
        action: "api_key.created",
        target: "key_live_***",
        createdAt: new Date(now - 86400000).toISOString(),
      },
    ],
  };
}

function mapStatus(raw: Record<string, unknown>): SecurityStatusItem {
  return {
    id: String(raw.id ?? raw.label),
    label: pickString(raw, "label", "name") || "Status",
    status: (pickString(raw, "status") || "unknown") as SecurityStatusItem["status"],
    detail: pickString(raw, "detail", "description") || "",
  };
}

function mapLog(raw: Record<string, unknown>): SecurityAuditLog {
  return {
    id: String(raw.id),
    actor: pickString(raw, "actor", "user", "email") || "system",
    action: pickString(raw, "action", "event") || "event",
    target: pickString(raw, "target", "resource") || undefined,
    ip: pickString(raw, "ip", "ip_address") || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at", "timestamp"),
  };
}

export async function fetchSecurityOverview(
  organizationId?: string | null,
): Promise<SecurityOverview> {
  if (isDemoMode()) return demoOverview();
  try {
    const [statusPayload, logsPayload] = await Promise.all([
      api.get<
        Record<string, unknown>[] | { results: Record<string, unknown>[] } | Record<string, unknown>
      >(withOrg(API_ENDPOINTS.security.status, organizationId)),
      api
        .get<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(
          withOrg(API_ENDPOINTS.security.auditLogs, organizationId),
        )
        .catch(() => []),
    ]);

    let status: SecurityStatusItem[] = [];
    if (Array.isArray(statusPayload)) {
      status = statusPayload.map(mapStatus);
    } else if (statusPayload && typeof statusPayload === "object" && "results" in statusPayload) {
      status = unwrapList(statusPayload as { results: Record<string, unknown>[] }).map(mapStatus);
    } else if (statusPayload && typeof statusPayload === "object") {
      status = Object.entries(statusPayload as Record<string, unknown>).map(([key, value]) => {
        if (value && typeof value === "object") {
          return mapStatus({ id: key, ...(value as Record<string, unknown>) });
        }
        return {
          id: key,
          label: key,
          status: "unknown" as const,
          detail: String(value),
        };
      });
    }

    return {
      status,
      auditLogs: unwrapList(logsPayload as Record<string, unknown>[]).map(mapLog),
    };
  } catch {
    return { status: [], auditLogs: [] };
  }
}

export async function triggerBackup(
  organizationId?: string | null,
): Promise<{ status: string; message: string }> {
  if (isDemoMode()) {
    return {
      status: "queued",
      message: "Backup job queued (demo)",
    };
  }
  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.security.backup, organizationId),
    { organization_id: organizationId },
  );
  return {
    status: pickString(payload, "status") || "queued",
    message: pickString(payload, "message", "detail") || "Backup started",
  };
}

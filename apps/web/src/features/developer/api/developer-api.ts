import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  ApiKey,
  CreateApiKeyInput,
  CreateWebhookInput,
  WebhookEndpoint,
} from "@/features/developer/types";

const now = Date.now();

let demoKeys: ApiKey[] = [
  {
    id: "key-1",
    name: "Production",
    prefix: "nvx_live_9f3a",
    createdAt: new Date(now - 86400000 * 20).toISOString(),
    lastUsedAt: new Date(now - 3600000).toISOString(),
  },
];

let demoWebhooks: WebhookEndpoint[] = [
  {
    id: "wh-1",
    url: "https://example.com/hooks/novixa",
    events: ["workflow.completed", "agent.run.finished"],
    active: true,
    createdAt: new Date(now - 86400000 * 10).toISOString(),
    updatedAt: new Date(now - 86400000 * 2).toISOString(),
  },
];

function mapKey(raw: Record<string, unknown>): ApiKey {
  return {
    id: String(raw.id),
    name: pickString(raw, "name") || "API key",
    prefix: pickString(raw, "prefix", "key_prefix", "hint") || String(raw.id).slice(0, 12),
    createdAt: pickIso(raw, "createdAt", "created_at"),
    lastUsedAt: pickString(raw, "lastUsedAt", "last_used_at") || undefined,
    revokedAt: pickString(raw, "revokedAt", "revoked_at") || null,
    secret: pickString(raw, "secret", "key", "token") || undefined,
  };
}

function mapWebhook(raw: Record<string, unknown>): WebhookEndpoint {
  return {
    id: String(raw.id),
    url: pickString(raw, "url", "endpoint") || "",
    events: Array.isArray(raw.events) ? raw.events.map(String) : [],
    active: Boolean(raw.active ?? raw.is_active ?? true),
    secret: pickString(raw, "secret") || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

export async function fetchApiKeys(organizationId?: string | null): Promise<ApiKey[]> {
  if (isDemoMode()) return demoKeys.filter((k) => !k.revokedAt);
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.apiKeys.list, organizationId));
    return unwrapList(payload).map(mapKey);
  } catch {
    return [];
  }
}

export async function createApiKey(
  input: CreateApiKeyInput,
  organizationId?: string | null,
): Promise<ApiKey> {
  if (isDemoMode()) {
    const secret = `nvx_live_${Math.random().toString(36).slice(2, 18)}`;
    const key: ApiKey = {
      id: `key-${Date.now()}`,
      name: input.name,
      prefix: secret.slice(0, 12),
      createdAt: new Date().toISOString(),
      secret,
    };
    demoKeys = [key, ...demoKeys];
    return key;
  }
  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.apiKeys.create, organizationId),
    { name: input.name, organization_id: organizationId },
  );
  return mapKey(payload);
}

export async function revokeApiKey(id: string, organizationId?: string | null): Promise<void> {
  if (isDemoMode()) {
    demoKeys = demoKeys.map((k) =>
      k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k,
    );
    return;
  }
  await api.delete(withOrg(API_ENDPOINTS.apiKeys.revoke(id), organizationId));
}

export async function fetchWebhooks(organizationId?: string | null): Promise<WebhookEndpoint[]> {
  if (isDemoMode()) return [...demoWebhooks];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.webhooks.list, organizationId));
    return unwrapList(payload).map(mapWebhook);
  } catch {
    return [];
  }
}

export async function createWebhook(
  input: CreateWebhookInput,
  organizationId?: string | null,
): Promise<WebhookEndpoint> {
  if (isDemoMode()) {
    const webhook: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      url: input.url,
      events: input.events,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoWebhooks = [webhook, ...demoWebhooks];
    return webhook;
  }
  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.webhooks.create, organizationId),
    {
      url: input.url,
      events: input.events,
      organization_id: organizationId,
    },
  );
  return mapWebhook(payload);
}

export async function updateWebhook(
  id: string,
  input: Partial<CreateWebhookInput> & { active?: boolean },
  organizationId?: string | null,
): Promise<WebhookEndpoint> {
  if (isDemoMode()) {
    demoWebhooks = demoWebhooks.map((w) =>
      w.id === id
        ? {
            ...w,
            ...input,
            events: input.events ?? w.events,
            updatedAt: new Date().toISOString(),
          }
        : w,
    );
    return demoWebhooks.find((w) => w.id === id)!;
  }
  const payload = await api.patch<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.webhooks.update(id), organizationId),
    { ...input, organization_id: organizationId },
  );
  return mapWebhook(payload);
}

export async function deleteWebhook(id: string, organizationId?: string | null): Promise<void> {
  if (isDemoMode()) {
    demoWebhooks = demoWebhooks.filter((w) => w.id !== id);
    return;
  }
  await api.delete(withOrg(API_ENDPOINTS.webhooks.delete(id), organizationId));
}

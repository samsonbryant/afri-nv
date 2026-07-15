export function withOrg(path: string, organizationId?: string | null): string {
  if (!organizationId) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}organization_id=${encodeURIComponent(organizationId)}`;
}

export function unwrapList<T>(payload: T[] | { results?: T[] } | null | undefined): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.results ?? [];
}

export function pickString(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
}

export function pickNumber(raw: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

export function pickIso(raw: Record<string, unknown>, ...keys: string[]): string {
  const value = pickString(raw, ...keys);
  return value || new Date().toISOString();
}

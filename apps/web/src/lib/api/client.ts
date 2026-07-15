import { ApiError } from "@/lib/api/errors";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiClientOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
  signal?: AbortSignal;
  cache?: RequestCache;
};

const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("novixa-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { accessToken?: string | null };
    };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    headers: customHeaders,
    token,
    signal,
    cache = "no-store",
  } = options;

  const accessToken = token === undefined ? getAccessToken() : token;
  const headers = new Headers(customHeaders);

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  headers.set("Accept", "application/json");

  const url = path.startsWith("http")
    ? path
    : `${DEFAULT_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    signal,
    cache,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof (payload as { detail: unknown }).detail === "string"
        ? (payload as { detail: string }).detail
        : typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof (payload as { message: unknown }).message === "string"
          ? (payload as { message: string }).message
          : `Request failed with status ${response.status}`;

    const code =
      typeof payload === "object" &&
      payload !== null &&
      "code" in payload &&
      typeof (payload as { code: unknown }).code === "string"
        ? (payload as { code: string }).code
        : "http_error";

    throw new ApiError(message, {
      status: response.status,
      code,
      details:
        typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>)
          : undefined,
    });
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<ApiClientOptions, "method" | "body">) =>
    apiClient<T>(path, { ...options, method: "DELETE" }),
};

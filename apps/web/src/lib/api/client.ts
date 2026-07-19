import { useAuthStore } from "@/features/auth/stores/auth-store";
import { ApiError } from "@/lib/api/errors";
import { API_URL, AUTH_STORAGE_KEY } from "@/lib/constants";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiClientOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
  signal?: AbortSignal;
  cache?: RequestCache;
  /** Skip Authorization + refresh handling (login/register/etc). */
  skipAuth?: boolean;
};

const DEFAULT_BASE = API_URL;

function readPersistedAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { accessToken?: string | null };
    };
    return parsed.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function readPersistedRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: { refreshToken?: string | null };
    };
    return parsed.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

/** Prefer in-memory auth store so requests work before persist flushes to localStorage. */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return useAuthStore.getState().accessToken ?? readPersistedAccessToken();
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return useAuthStore.getState().refreshToken ?? readPersistedRefreshToken();
}

function clearAuthSession(): void {
  useAuthStore.getState().logout();
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
    const nested = obj.error;
    if (typeof nested === "object" && nested !== null) {
      const err = nested as Record<string, unknown>;
      if (typeof err.message === "string") return err.message;
      if (typeof err.detail === "string") return err.detail;
      if (err.message && typeof err.message === "object") {
        const msgObj = err.message as Record<string, unknown>;
        if (typeof msgObj.detail === "string") return msgObj.detail;
      }
    }
  }
  return `Request failed with status ${status}`;
}

function extractErrorCode(payload: unknown): string {
  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.code === "string") return obj.code;
    const nested = obj.error;
    if (typeof nested === "object" && nested !== null) {
      const err = nested as Record<string, unknown>;
      if (typeof err.code === "string") return err.code;
    }
  }
  return "http_error";
}

function isCredentialPath(path: string): boolean {
  return /\/auth\/(login|register|refresh|forgot-password|reset-password|social|2fa\/verify)\//.test(
    path,
  );
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh || refresh.startsWith("demo-")) return null;

  const url = `${DEFAULT_BASE.replace(/\/$/, "")}/auth/refresh/`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Record<string, unknown>;
    const tokens = (payload.tokens ?? payload) as Record<string, unknown>;
    const access = typeof tokens.access === "string" ? tokens.access : null;
    const nextRefresh = typeof tokens.refresh === "string" ? tokens.refresh : refresh;
    if (!access) return null;
    useAuthStore.getState().setTokens(access, nextRefresh);
    return access;
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
    skipAuth = false,
  } = options;

  let accessToken = skipAuth ? null : token === undefined ? getAccessToken() : token;
  // Never send demo tokens to the real API
  if (accessToken?.startsWith("demo-")) {
    accessToken = null;
  }

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

  const doFetch = async (authHeader: string | null) => {
    const h = new Headers(headers);
    if (authHeader) h.set("Authorization", `Bearer ${authHeader}`);
    else h.delete("Authorization");
    return fetch(url, {
      method,
      headers: h,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal,
      cache,
    });
  };

  let response = await doFetch(accessToken);

  // One refresh retry on 401 for authenticated calls
  if (response.status === 401 && !skipAuth && !isCredentialPath(path) && token === undefined) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await doFetch(refreshed);
    } else if (accessToken) {
      clearAuthSession();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(payload, response.status), {
      status: response.status,
      code: extractErrorCode(payload),
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

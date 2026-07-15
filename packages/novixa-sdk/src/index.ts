export type NovixaClientOptions = {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  fetch?: typeof fetch;
};

export type NovixaRequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
};

export class NovixaClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private accessToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: NovixaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.accessToken = options.accessToken;
    this.fetchImpl = options.fetch ?? fetch;
  }

  setAccessToken(token: string | undefined): void {
    this.accessToken = token;
  }

  async request<T = unknown>(path: string, options: NovixaRequestOptions = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers ?? {}),
    };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const response = await this.fetchImpl(url.toString(), {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Novixa API ${response.status}: ${text || response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  get<T = unknown>(path: string, query?: NovixaRequestOptions["query"]): Promise<T> {
    return this.request<T>(path, { method: "GET", query });
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export default NovixaClient;

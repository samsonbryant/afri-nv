import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Django API origin for server-side proxying (never exposed to the browser). */
function resolveProxyOrigin(): string {
  const explicit = (process.env.API_PROXY_TARGET ?? "").trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  const publicApi = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (publicApi && !publicApi.startsWith("/")) {
    try {
      return new URL(publicApi.includes("://") ? publicApi : `https://${publicApi}`).origin;
    } catch {
      /* fall through */
    }
  }

  throw new Error(
    "API_PROXY_TARGET is not set. Set it to your Render API origin, e.g. https://novixa-api.onrender.com",
  );
}

function buildUpstreamUrl(pathSegments: string[], search: string): string {
  const origin = resolveProxyOrigin();
  const path = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  // Django APPEND_SLASH / DRF routes expect a trailing slash.
  const pathname = path ? `/api/v1/${path}/` : "/api/v1/";
  return `${origin}${pathname}${search}`;
}

const REQUEST_DROP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
]);

/** Only forward safe upstream headers — never content-encoding (fetch decodes the body). */
const RESPONSE_ALLOW = new Set([
  "allow",
  "cache-control",
  "content-disposition",
  "content-language",
  "content-type",
  "etag",
  "expires",
  "last-modified",
  "retry-after",
  "www-authenticate",
  "x-request-id",
]);

function filterRequestHeaders(source: Headers, upstreamHost: string): Headers {
  const headers = new Headers();
  source.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (REQUEST_DROP.has(lower)) return;
    if (lower.startsWith("x-forwarded-")) return;
    if (lower.startsWith("x-vercel-")) return;
    headers.set(key, value);
  });
  // Talk to Render as HTTPS; do not leak the Vercel Host (SSL redirect loops).
  headers.set("host", upstreamHost);
  headers.set("x-forwarded-proto", "https");
  headers.set("x-forwarded-host", upstreamHost);
  headers.set("accept-encoding", "identity");
  return headers;
}

function buildClientHeaders(source: Headers): Headers {
  const headers = new Headers();
  source.forEach((value, key) => {
    if (RESPONSE_ALLOW.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  // Ensure browsers never try to brotli/gzip-decode a body we already hold decoded.
  headers.delete("content-encoding");
  headers.delete("content-length");
  return headers;
}

async function proxyRequest(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  let upstreamUrl: string;
  try {
    upstreamUrl = buildUpstreamUrl(pathSegments, req.nextUrl.search);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "proxy_misconfigured",
          message: error instanceof Error ? error.message : "API proxy is not configured",
        },
      },
      { status: 500 },
    );
  }

  const upstreamHost = new URL(upstreamUrl).host;
  const headers = filterRequestHeaders(req.headers, upstreamHost);
  const method = req.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = req.body;
    (init as RequestInit & { duplex?: string }).duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, init);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "proxy_upstream_error",
          message: error instanceof Error ? error.message : "Failed to reach API",
        },
      },
      { status: 502 },
    );
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location");
    if (location) {
      try {
        const nextUrl = new URL(location, upstreamUrl);
        const origin = resolveProxyOrigin();
        if (nextUrl.origin === new URL(origin).origin) {
          upstream = await fetch(nextUrl.toString(), {
            method,
            headers,
            body: init.body,
            redirect: "manual",
            cache: "no-store",
            ...(init.body ? { duplex: "half" } : {}),
          } as RequestInit);
        }
      } catch {
        /* fall through */
      }
    }
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    return NextResponse.json(
      {
        error: {
          code: "proxy_redirect_blocked",
          message: "Upstream redirect was not followed",
        },
      },
      { status: 502 },
    );
  }

  // Buffer the decoded body. Streaming upstream.body while Cloudflare/Render sent
  // content-encoding caused Vercel to advertise br/gzip with a plain body →
  // net::ERR_CONTENT_DECODING_FAILED in the browser.
  const clientHeaders = buildClientHeaders(upstream.headers);
  const contentType = (upstream.headers.get("content-type") ?? "").toLowerCase();

  if (method === "HEAD") {
    return new NextResponse(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: clientHeaders,
    });
  }

  if (contentType.includes("application/json")) {
    const text = await upstream.text();
    // Pass through raw JSON text to preserve exact payload; avoid re-encoding quirks.
    clientHeaders.set("content-type", "application/json");
    return new NextResponse(text, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: clientHeaders,
    });
  }

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: clientHeaders,
  });
}

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path = [] } = await context.params;
  return proxyRequest(req, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;

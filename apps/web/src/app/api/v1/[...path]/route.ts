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

const HOP_BY_HOP = new Set([
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
]);

function filterRequestHeaders(source: Headers, upstreamHost: string): Headers {
  const headers = new Headers();
  source.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower.startsWith("x-forwarded-")) return;
    if (lower === "x-vercel-id" || lower === "x-vercel-forwarded-for") return;
    headers.set(key, value);
  });
  // Talk to Render as HTTPS; do not leak the Vercel Host (that triggered SSL redirect loops).
  headers.set("host", upstreamHost);
  headers.set("x-forwarded-proto", "https");
  headers.set("x-forwarded-host", upstreamHost);
  return headers;
}

function filterResponseHeaders(source: Headers): Headers {
  const headers = new Headers();
  source.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // Relative Location from Django would bounce back through Vercel — drop redirects.
    if (lower === "location") return;
    headers.set(key, value);
  });
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
    // Required when streaming a request body in Node fetch.
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

  // Follow a single upstream redirect only if it stays on the API origin (e.g. APPEND_SLASH).
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
        /* return original redirect response below without Location */
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

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: filterResponseHeaders(upstream.headers),
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

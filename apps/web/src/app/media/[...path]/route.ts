import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  throw new Error("API_PROXY_TARGET is not set");
}

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyMedia(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path = [] } = await context.params;
  let origin: string;
  try {
    origin = resolveProxyOrigin();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "proxy misconfigured" },
      { status: 500 },
    );
  }

  const mediaPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const upstreamUrl = `${origin}/media/${mediaPath}${req.nextUrl.search}`;
  const upstreamHost = new URL(origin).host;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        host: upstreamHost,
        "x-forwarded-proto": "https",
        "x-forwarded-host": upstreamHost,
        accept: req.headers.get("accept") ?? "*/*",
      },
      redirect: "follow",
      cache: "no-store",
    });

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    const cacheControl = upstream.headers.get("cache-control");
    if (cacheControl) headers.set("cache-control", cacheControl);

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "media proxy failed" },
      { status: 502 },
    );
  }
}

export const GET = proxyMedia;
export const HEAD = proxyMedia;

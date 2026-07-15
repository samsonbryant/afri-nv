import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Soft route hint for dashboard paths.
 * Real session tokens live in localStorage (Zustand), so AuthGuard is the source of truth.
 * This middleware only keeps obvious anonymous hits from landing on protected shells
 * when a lightweight cookie is present in the future.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/workflows") ||
    pathname.startsWith("/automations") ||
    pathname.startsWith("/assistant") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (!isDashboard) {
    return NextResponse.next();
  }

  // Cookie bridge optional; client AuthGuard enforces auth.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workflows/:path*",
    "/automations/:path*",
    "/assistant/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};

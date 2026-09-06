import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Soft route hint for dashboard paths.
 * Real session tokens live in localStorage (Zustand), so AuthGuard is the source of truth.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workflows/:path*",
    "/automations/:path*",
    "/assistant/:path*",
    "/knowledge/:path*",
    "/crm/:path*",
    "/support/:path*",
    "/marketing/:path*",
    "/documents/:path*",
    "/reports/:path*",
    "/meetings/:path*",
    "/agents/:path*",
    "/billing/:path*",
    "/analytics/:path*",
    "/security/:path*",
    "/developer/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};

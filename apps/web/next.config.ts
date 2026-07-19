import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

/** Origin of the Django API for server-side rewrites (never exposed to the browser). */
function resolveApiProxyTarget(): string | null {
  const explicit = (process.env.API_PROXY_TARGET ?? "").trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  const publicApi = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (!publicApi || publicApi.startsWith("/")) return null;
  try {
    const url = new URL(publicApi.includes("://") ? publicApi : `https://${publicApi}`);
    return url.origin;
  } catch {
    return null;
  }
}

const apiProxyTarget = resolveApiProxyTarget();

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Django APPEND_SLASH expects trailing slashes. Next's default 308 (strip slash)
  // + Django's 301 (add slash) caused ERR_TOO_MANY_REDIRECTS on /api/v1/* via the proxy.
  skipTrailingSlashRedirect: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.novixa.ai",
      },
      {
        protocol: "https",
        hostname: "**.onrender.com",
      },
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  /**
   * Same-origin proxy so browsers (esp. Orange Liberia) never dial Render directly.
   * Client calls `/api/v1/...` on the Vercel host; Next rewrites to the Django origin.
   */
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
      {
        source: "/api/docs",
        destination: `${apiProxyTarget}/api/docs/`,
      },
      {
        source: "/api/docs/:path*",
        destination: `${apiProxyTarget}/api/docs/:path*`,
      },
      {
        source: "/graphql",
        destination: `${apiProxyTarget}/graphql/`,
      },
      {
        source: "/graphql/:path*",
        destination: `${apiProxyTarget}/graphql/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${apiProxyTarget}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;

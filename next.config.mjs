/** @type {import('next').NextConfig} */
import { DEFAULT_BACKEND_HOST } from "./src/lib/constants/backend-host.mjs"

const devHostIp = process.env.NEXT_PUBLIC_DEV_HOST_IP

// Backend host for image remotePatterns. Default lives in a single shared
// constant (see backend-host.mjs); override via NEXT_PUBLIC_BACKEND_HOST.
const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST || DEFAULT_BACKEND_HOST

// Content-Security-Policy is set per-request in src/middleware.ts so it can
// include a fresh nonce. Static, non-nonce headers remain here.

const nextConfig = {
  allowedDevOrigins: ["seller.localhost", "admin.localhost", ...(devHostIp ? [devHostIp] : [])],
  async rewrites() {
    // When API_URL is set (server-side env var), proxy /api/v1/* through Next.js.
    // This keeps cookies same-origin (browser → :3000 → backend), avoiding
    // the cross-port SameSite cookie issue that breaks refresh token flows.
    const apiUrl = process.env.API_URL
    if (!apiUrl) return []
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ]
  },
  headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: backendHost },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
      ...(devHostIp ? [{ protocol: /** @type {"http"} */ ("http"), hostname: devHostIp }] : []),
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig

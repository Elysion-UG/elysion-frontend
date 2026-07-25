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
        // /api/v1/auth/* is deliberately excluded: it must reach the route
        // handler at src/app/api/v1/auth/[...path]/route.ts, which emits the
        // session_present marker the middleware gates on (#68).
        //
        // The exclusion is load-bearing, not defensive. A rewrite returned as a
        // plain array is an `afterFiles` rewrite, and those are matched BEFORE
        // dynamic routes — so `/api/v1/:path*` shadows the catch-all handler
        // and the marker is never set. That is invisible locally (.env.local
        // leaves API_URL empty → no rewrite at all → the handler runs) and only
        // breaks where API_URL is set, i.e. every deployed environment (#143).
        source: "/api/v1/:path((?!auth/).*)",
        destination: `${apiUrl}/api/v1/:path`,
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
    // Server-side allowlist for hosts next/image is permitted to fetch and
    // optimise. Kept aligned with the browser-facing `img-src` in
    // src/middleware.ts (self + backend origin, plus localhost in dev): both
    // layers must agree, otherwise an image passes one gate and is blocked by
    // the other (#67). The v0-generation demo hosts placehold.co /
    // images.unsplash.com were unused and have been dropped so neither layer
    // trusts a host the app never loads from.
    remotePatterns: [
      { protocol: "https", hostname: backendHost },
      { protocol: "http", hostname: "localhost" },
      ...(devHostIp ? [{ protocol: /** @type {"http"} */ ("http"), hostname: devHostIp }] : []),
    ],
    // SVG is served through next/image because product/brand assets from the
    // backend include it. An SVG is an active document, so the three settings
    // below only make sense together — do not enable the first without the
    // other two:
    //   - contentDispositionType "attachment" stops the browser from rendering
    //     a fetched SVG as a top-level document on our own origin,
    //   - the per-image CSP sandboxes it and forbids any script inside it.
    // Residual assumption: backend-delivered SVGs stay trustworthy. If images
    // ever come from an untrusted uploader, rasterise instead of relaxing this.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig

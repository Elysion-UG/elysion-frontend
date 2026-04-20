/** @type {import('next').NextConfig} */
const devHostIp = process.env.NEXT_PUBLIC_DEV_HOST_IP

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
      {
        protocol: "https",
        hostname: "marketplace-backend-1-1w30.onrender.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      ...(devHostIp ? [{ protocol: /** @type {"http"} */ ("http"), hostname: devHostIp }] : []),
    ],
  },
}

export default nextConfig

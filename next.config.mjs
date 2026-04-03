/** @type {import('next').NextConfig} */
const devHostIp = process.env.NEXT_PUBLIC_DEV_HOST_IP

const nextConfig = {
  allowedDevOrigins: devHostIp ? [devHostIp] : [],
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

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
}
export default nextConfig

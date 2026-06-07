import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8080"),
  SELLER_DOMAIN: z.string().min(1, "SELLER_DOMAIN must be set (e.g. seller.localhost:3000)"),
  ADMIN_DOMAIN: z.string().min(1, "ADMIN_DOMAIN must be set (e.g. admin.localhost:3000)"),
  BUYER_DOMAIN: z.string().min(1, "BUYER_DOMAIN must be set (e.g. localhost:3000)"),
  // Backend image/CSP allowlist host (no protocol, no path).
  // Used by next.config.mjs (remotePatterns) and middleware.ts (CSP img-src/connect-src).
  // Default = production fallback so existing deployments keep working.
  NEXT_PUBLIC_BACKEND_HOST: z.string().min(1).default("marketplace-backend-1-1w30.onrender.com"),
})

const _env = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  SELLER_DOMAIN: process.env.SELLER_DOMAIN,
  ADMIN_DOMAIN: process.env.ADMIN_DOMAIN,
  BUYER_DOMAIN: process.env.BUYER_DOMAIN,
  NEXT_PUBLIC_BACKEND_HOST: process.env.NEXT_PUBLIC_BACKEND_HOST,
})

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.flatten().fieldErrors)
  throw new Error("Invalid environment variables")
}

export const env = _env.data

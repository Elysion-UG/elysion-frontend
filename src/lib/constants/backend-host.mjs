// Single source of truth for the backend host (no protocol, no path).
//
// Used in three contexts that each run in a different runtime and therefore
// cannot share a regular TypeScript module:
//   - next.config.mjs       → image `remotePatterns` (build config)
//   - src/middleware.ts      → CSP `img-src` / `connect-src` (edge runtime)
//   - src/lib/env.ts         → Zod default for NEXT_PUBLIC_BACKEND_HOST (app runtime)
//
// A plain `.mjs` constant is importable from all three. Override per
// environment via the NEXT_PUBLIC_BACKEND_HOST env var.
//
// Default points at the live staging backend; the previous production host
// is out of service (BE#122) and must not be used as a fallback.
export const DEFAULT_BACKEND_HOST = "elysion-backend-stage.onrender.com"

// Resolve the backend host, failing fast on a real production deployment when
// NEXT_PUBLIC_BACKEND_HOST is unset — instead of silently pointing the CSP
// allowlist (middleware) and the image optimiser (next.config) at the staging
// backend (F5 from the 2026-07-17 security review, tracked in #145).
//
// The trigger is VERCEL_ENV, not NODE_ENV: NEXT_PUBLIC_BACKEND_HOST is inlined
// at build time, so the choke point is the production *build*, and `next build`
// runs with NODE_ENV=production everywhere (CI, local) — a NODE_ENV gate would
// break every build that doesn't set the var. VERCEL_ENV==="production" fires
// only on an actual production deployment on Vercel; preview / dev / CI keep the
// staging fallback. (This is why it differs from the API_URL request-time guard,
// which governs a server-only var read at runtime.)
//
// `env` is injectable so the behaviour is unit-testable without mutating the
// process environment.
//
/**
 * @param {Record<string, string | undefined>} [env]
 * @returns {string}
 */
export function resolveBackendHost(env = process.env) {
  const host = env.NEXT_PUBLIC_BACKEND_HOST
  if (host) return host
  if (env.VERCEL_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_HOST must be set for production deployments — refusing to fall " +
        "back to the staging backend for the CSP allowlist / image optimisation (F5, #145)."
    )
  }
  return DEFAULT_BACKEND_HOST
}

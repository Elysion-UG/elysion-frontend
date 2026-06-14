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

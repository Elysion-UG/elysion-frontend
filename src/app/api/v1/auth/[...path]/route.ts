/**
 * Catch-all proxy for /api/v1/auth/* endpoints.
 *
 * Next.js rewrites can drop cookies when proxying requests upstream.
 * Auth endpoints (login, refresh, logout) depend on HttpOnly cookies
 * for the refresh token flow. This API route explicitly forwards the
 * Cookie header to the backend and relays Set-Cookie headers back,
 * ensuring the refresh token cookie round-trips correctly.
 *
 * The rewrite in next.config.mjs still handles all other /api/v1/*
 * endpoints that don't rely on cookies.
 */
import { type NextRequest, NextResponse } from "next/server"

import { SESSION_MARKER_COOKIE } from "@/src/lib/auth/session-marker"

// Resolve backend URL at request time (not module load time) so that:
//   1. tests / build-time imports don't crash if API_URL is unset
//   2. a missing API_URL in production is reported via a request-time error
//      instead of silently proxying every auth request to localhost:8080.
function resolveBackendUrl(): string {
  const url = process.env.API_URL
  if (url) return url
  if (process.env.NODE_ENV === "production") {
    throw new Error("API_URL environment variable is required in production for the auth proxy.")
  }
  return "http://localhost:8080"
}

/**
 * Client IP as determined by the hosting platform (#32).
 *
 * On Vercel, x-real-ip is set by the edge to the observed client IP and
 * cannot be client-spoofed — that is the primary source. x-forwarded-for
 * is appended to (not replaced), so only the LAST entry is platform-added;
 * the fallback therefore reads the rightmost entry, never the leftmost
 * (which is client-controlled). Outside Vercel (local dev) both headers are
 * client-controlled, but the backend only trusts the forwarded IP when
 * AUTH_PROXY_SECRET is configured and matches — which is only the case on
 * deployed environments.
 */
function platformClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")
  if (realIp && isPlausibleIp(realIp.trim())) return realIp.trim()
  const lastForwardedFor = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
  if (lastForwardedFor && isPlausibleIp(lastForwardedFor)) return lastForwardedFor
  return "127.0.0.1"
}

// Light sanity check (IPv4/IPv6 charset + length) before forwarding the value
// upstream — never relay arbitrary header content as an IP.
function isPlausibleIp(value: string): boolean {
  return value.length <= 45 && /^[0-9a-fA-F.:]+$/.test(value) && /[.:]/.test(value)
}

/**
 * Derive the session-presence marker cookie (#68) from the backend's
 * `refreshToken` Set-Cookie header.
 *
 * The refresh cookie is scoped to `Path=/api/v1/auth` and is invisible to the
 * middleware on navigation requests. This marker mirrors its lifecycle at
 * `Path=/` so the middleware can gate protected routes — but carries no token,
 * only a boolean hint. Its `Max-Age` / `Secure` attributes are copied from the
 * refresh cookie so it shares the same lifetime: login and successful refresh
 * set it, logout clears it. On a refresh FAILURE nothing is cleared (the
 * backend emits no Set-Cookie on a 401), so — exactly like the real refresh
 * cookie — the marker lingers until its Max-Age expires. The middleware treats
 * a lingering marker as "maybe a session"; the client guards do the real check.
 *
 * Returns `null` for any Set-Cookie that is not the refresh cookie.
 */
function sessionMarkerFor(refreshSetCookie: string): string | null {
  const valueMatch = /^\s*refreshToken=([^;]*)/i.exec(refreshSetCookie)
  if (!valueMatch) return null

  const secure = /;\s*Secure/i.test(refreshSetCookie)
  const maxAge = /;\s*Max-Age=(-?\d+)/i.exec(refreshSetCookie)?.[1]
  // The backend clears the refresh cookie with an empty value and Max-Age=0.
  const cleared = valueMatch[1] === "" || maxAge === "0"

  const parts = [
    `${SESSION_MARKER_COOKIE}=${cleared ? "" : "1"}`,
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
  ]
  if (cleared) parts.push("Max-Age=0")
  else if (maxAge) parts.push(`Max-Age=${maxAge}`)
  if (secure) parts.push("Secure")
  return parts.join("; ")
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const subpath = path.join("/")
  const url = new URL(request.url)
  const qs = url.search

  const clientIp = platformClientIp(request)

  const outgoingHeaders: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    Cookie: request.headers.get("cookie") ?? "",
    // Forward only the platform-verified client IP — never the raw,
    // client-controlled header chain (rate-limit spoofing, see #32).
    // X-Real-IP is deliberately NOT forwarded: the backend must never treat
    // a client-influenced header as trusted; X-Client-IP + proxy secret is
    // the only trusted channel.
    "X-Forwarded-For": clientIp,
    "X-Client-IP": clientIp,
  }

  // Shared secret that lets the backend trust X-Client-IP for rate limiting
  // (backend: app.auth.rate-limit.trusted-proxy-secret, see backend#149).
  const proxySecret = process.env.AUTH_PROXY_SECRET
  if (proxySecret) {
    outgoingHeaders["X-Auth-Proxy-Secret"] = proxySecret
  }

  // The backend enforces Origin on its cookie-bearing endpoints: /auth/refresh
  // answers 401 for a known origin but 403 when Origin is absent or foreign.
  // Because this handler rebuilds the header set from scratch, the browser's
  // Origin was dropped and every proxied refresh 403'd — invisible while auth
  // traffic still went to the backend directly (#148).
  //
  // Forwarded verbatim and never fabricated: the value is the backend's CSRF
  // signal, so it has to stay the browser's claim for the backend to reject a
  // foreign one. A same-origin request carries no Origin on some browsers, so
  // absence is passed through as absence rather than filled in.
  const origin = request.headers.get("origin")
  if (origin) {
    outgoingHeaders["Origin"] = origin
  }

  const authorization = request.headers.get("authorization")
  if (authorization) {
    outgoingHeaders["Authorization"] = authorization
  }

  const upstream = await fetch(`${resolveBackendUrl()}/api/v1/auth/${subpath}${qs}`, {
    method: request.method,
    headers: outgoingHeaders,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
  })

  const body = await upstream.text()
  const res = new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  })

  // Forward Set-Cookie headers (refresh token set/rotate/clear) back to the browser.
  // Strip Domain so the cookie is bound to the current host (the backend may set
  // Domain=localhost for the API origin, which the browser would reject on
  // seller.localhost / admin.localhost subdomains).
  // Keep the backend-provided Path as-is — the refresh cookie only needs to reach
  // /api/v1/auth/refresh and broadening its scope would unnecessarily leak it to
  // every request.
  const setCookies = upstream.headers.getSetCookie()
  for (const sc of setCookies) {
    const rewritten = sc.replace(/;\s*Domain=[^;]*/i, "")
    res.headers.append("Set-Cookie", rewritten)

    // Mirror the refresh cookie as a Path=/ presence marker so the middleware
    // can gate protected routes (#68). No-op for non-refresh cookies.
    const marker = sessionMarkerFor(rewritten)
    if (marker) res.headers.append("Set-Cookie", marker)
  }

  return res
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy

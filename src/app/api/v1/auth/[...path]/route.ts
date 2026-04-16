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

const BACKEND_URL = process.env.API_URL ?? "http://localhost:8080"

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const subpath = path.join("/")
  const url = new URL(request.url)
  const qs = url.search

  const forwardedFor =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
  const realIp = request.headers.get("x-real-ip") ?? forwardedFor.split(",")[0].trim()

  const outgoingHeaders: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    Cookie: request.headers.get("cookie") ?? "",
    "X-Forwarded-For": forwardedFor,
    "X-Real-IP": realIp,
  }

  const authorization = request.headers.get("authorization")
  if (authorization) {
    outgoingHeaders["Authorization"] = authorization
  }

  const upstream = await fetch(`${BACKEND_URL}/api/v1/auth/${subpath}${qs}`, {
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
  }

  return res
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy

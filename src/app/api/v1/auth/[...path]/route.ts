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
  const qs = url.search // includes leading "?"

  const upstream = await fetch(`${BACKEND_URL}/api/v1/auth/${subpath}${qs}`, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      Cookie: request.headers.get("cookie") ?? "",
    },
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
  })

  const body = await upstream.text()
  const res = new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  })

  // Forward Set-Cookie headers (refresh token set/rotate/clear) back to the browser.
  // Rewrite Path to "/" so the cookie is visible to the Next.js middleware on ALL
  // routes (e.g. /profil, /orders). The backend typically sets Path=/api/v1/auth
  // which would make the cookie invisible to non-API navigation requests.
  const setCookies = upstream.headers.getSetCookie()
  for (const sc of setCookies) {
    const rewritten = sc.replace(/Path=\/[^;]*/i, "Path=/")
    res.headers.append("Set-Cookie", rewritten)
  }

  return res
}

export const GET = proxy
export const POST = proxy
export const PATCH = proxy

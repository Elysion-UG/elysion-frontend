/**
 * api-client.ts — central HTTP client for all backend requests.
 *
 * Access token is stored in module memory (not localStorage) for XSS safety.
 * Refresh token is HttpOnly cookie managed by the browser automatically.
 *
 * Backend base URL: http://localhost:8080 (or NEXT_PUBLIC_API_URL env var)
 * Response envelope: { status: "success"|"error", message: string|null, data: T }
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

// ── Session persistence ────────────────────────────────────────────────────────
// Storing { token, user } in sessionStorage lets us survive full-page navigations
// within the same browser tab (<a href> reloads). The key is owned here so that
// the token can be restored *synchronously* at module-load time — before React
// renders or any useEffect fires.

export const AUTH_SESSION_KEY = "auth_session"

export interface PersistedAuthSession {
  token: string
  user: unknown
}

export function saveAuthSession(token: string, user: unknown): void {
  try {
    window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, user }))
  } catch {}
}

export function loadAuthSession(): PersistedAuthSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY)
    const result = raw ? (JSON.parse(raw) as PersistedAuthSession) : null
    console.log(
      "[auth] loadAuthSession():",
      result ? `token present (${result.token.slice(0, 20)}…)` : "null — no session in storage"
    )
    return result
  } catch {
    return null
  }
}

export function clearAuthSession(): void {
  try {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY)
  } catch {}
}

// ── Token store ────────────────────────────────────────────────────────────────
// _accessToken lives in module memory for XSS safety.
//
// IMPORTANT: We seed it synchronously from sessionStorage at module-load time.
// React child effects run before parent effects (bottom-up order), so by the
// time any component's useEffect calls an API, the token must already be
// present in _accessToken — we cannot rely on AuthContext's useEffect to set
// it first.
//
// We parse the JWT exp claim locally before trusting the token. If already
// expired we clear sessionStorage immediately — otherwise an invalid
// Authorization header is sent to every request, including public endpoints,
// causing backends that validate auth eagerly to return 401.
let _accessToken: string | null = null

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number }
    if (!payload.exp) return false
    return payload.exp < Math.floor(Date.now() / 1000)
  } catch {
    return false // unparseable — let the server decide
  }
}

if (typeof window !== "undefined") {
  const persisted = loadAuthSession()
  if (persisted?.token) {
    if (isJwtExpired(persisted.token)) {
      console.log("[auth] module init — token expired, clearing sessionStorage")
      clearAuthSession()
    } else {
      _accessToken = persisted.token
      console.log(
        "[auth] module init — token restored from sessionStorage:",
        persisted.token.slice(0, 20) + "…"
      )
    }
  }
}

export function setAccessToken(token: string | null): void {
  console.log("[auth] setAccessToken():", token ? token.slice(0, 20) + "…" : "null")
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

// Error class
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

// Shared in-flight refresh promise — deduplicates concurrent refresh calls.
// Without this, AuthContext's session-restore and a simultaneous 401 retry would
// both call POST /auth/refresh with the same cookie. Refresh-token rotation
// invalidates the cookie on the first use, so the second call would fail and
// either kick the user to home or leave the auth state empty.
type TokensResponse = { accessToken: string; user: unknown; expiresIn: number }

let _refreshInFlight: Promise<TokensResponse> | null = null

export async function refreshSession(): Promise<TokensResponse> {
  if (!_refreshInFlight) {
    console.log("[auth] refreshSession() — starting backend refresh")
    const p = import("@/src/services/auth.service")
      .then(({ AuthService }) => AuthService.refresh())
      .then((res) => {
        console.log(
          "[auth] refreshSession() — SUCCESS, new token:",
          res.accessToken?.slice(0, 20) + "…"
        )
        return res
      })
    p.catch((err) => {
      console.log("[auth] refreshSession() — FAILED:", err?.message ?? err)
    })
    p.finally(() => {
      _refreshInFlight = null
    })
    _refreshInFlight = p
  } else {
    console.log("[auth] refreshSession() — reusing in-flight promise")
  }
  return _refreshInFlight
}

// 401 refresh helper — uses shared refreshSession() to avoid concurrent refresh calls
async function tryRefreshAndRetry<T>(path: string, options: RequestInit): Promise<T> {
  // Capture whether the user had an active token before the refresh attempt.
  // Only redirect to home if their session actually expired — not if they were
  // simply never logged in (e.g. an unauthenticated visitor loading the cart).
  const hadToken = _accessToken != null
  try {
    const tokens = await refreshSession()
    setAccessToken(tokens.accessToken)
    return apiRequest<T>(path, options, true)
  } catch {
    setAccessToken(null)
    if (hadToken && typeof window !== "undefined") {
      console.log("[auth] REDIRECT → / — refresh failed after 401, hadToken=true, path:", path)
      const { toast } = await import("sonner")
      toast.error("Sitzung abgelaufen. Bitte erneut anmelden.")
      window.location.href = "/"
    }
    throw new ApiError(401, "Sitzung abgelaufen")
  }
}

// Core request function
// skipRetry=true prevents the 401 interceptor from triggering — use for the refresh
// endpoint itself to avoid infinite recursion.
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  skipRetry = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  }

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`
  }

  console.log(
    "[api]",
    options.method ?? "GET",
    path,
    "| token:",
    _accessToken ? "present" : "MISSING"
  )
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    // Always include cookies so the HttpOnly refreshToken cookie is sent
    credentials: "include",
  })

  // 204 No Content
  if (response.status === 204) {
    return null as T
  }

  // 401 Unauthorized — attempt token refresh once
  if (response.status === 401 && !skipRetry) {
    console.log("[auth] 401 on", path, "— attempting refresh retry")
    return tryRefreshAndRetry<T>(path, options)
  }

  const body = await response.json()

  if (!response.ok) {
    console.log(
      "[api] ERROR",
      response.status,
      path,
      body?.message ?? "(no message)",
      "skipRetry:",
      skipRetry
    )
    throw new ApiError(
      response.status,
      body?.message ?? `Request failed (${response.status})`,
      body
    )
  }

  return body.data as T
}

// Raw request (no ApiResponse unwrapping — returns body as-is, no data envelope extraction)
// Includes the same 401-refresh-retry logic as apiRequest so an expired token
// does not permanently break public endpoints that still validate auth headers.
export async function apiRequestRaw<T>(
  path: string,
  options: RequestInit = {},
  skipRetry = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  }

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })

  if (response.status === 204) {
    return null as T
  }

  if (response.status === 401 && !skipRetry) {
    console.log("[auth] 401 on", path, "— attempting refresh retry (raw)")
    // Refresh, update the token, then retry once without the envelope extraction
    const hadToken = _accessToken != null
    try {
      const tokens = await refreshSession()
      setAccessToken(tokens.accessToken)
      return apiRequestRaw<T>(path, options, true)
    } catch {
      setAccessToken(null)
      if (hadToken && typeof window !== "undefined") {
        console.log("[auth] REDIRECT → / — refresh failed after 401 (raw), path:", path)
        const { toast } = await import("sonner")
        toast.error("Sitzung abgelaufen. Bitte erneut anmelden.")
        window.location.href = "/"
      }
      throw new ApiError(401, "Sitzung abgelaufen")
    }
  }

  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.message ?? `Request failed (${response.status})`,
      body
    )
  }

  return body as T
}

// Multipart upload
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {}

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: form,
    credentials: "include",
  })

  if (response.status === 204) {
    return null as T
  }

  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? `Upload failed (${response.status})`, body)
  }

  return body.data as T
}

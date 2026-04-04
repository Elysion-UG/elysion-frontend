/**
 * api-client.ts — central HTTP client for all backend requests.
 *
 * Access token is stored in module memory (not localStorage) for XSS safety.
 * Refresh token is HttpOnly cookie managed by the browser automatically.
 *
 * Backend base URL: relative (same-origin) by default, or NEXT_PUBLIC_API_URL if set.
 * Relative paths keep requests same-origin across all subdomains (seller.*, admin.*).
 * Response envelope: { status: "success"|"error", message: string|null, data: T }
 */

import type { User } from "@/src/types"

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

// ── Session persistence ────────────────────────────────────────────────────────
// Storing { token, user } in sessionStorage lets us survive full-page navigations
// within the same browser tab (<a href> reloads). The key is owned here so that
// the token can be restored *synchronously* at module-load time — before React
// renders or any useEffect fires.

export const AUTH_SESSION_KEY = "auth_session"

export type AuthPortal = "customer" | "seller" | "admin"

export interface PersistedAuthSession {
  token: string
  user: User
  portal: AuthPortal
}

export function saveAuthSession(token: string, user: User, portal: AuthPortal): void {
  try {
    window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token, user, portal }))
  } catch {}
}

export function loadAuthSession(): PersistedAuthSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY)
    return raw ? (JSON.parse(raw) as PersistedAuthSession) : null
  } catch {
    return null
  }
}

export function clearAuthSession(): void {
  try {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY)
  } catch {}
}

// ── Query string builder ───────────────────────────────────────────────────────

/**
 * Builds a URL query string from a plain object.
 * Skips undefined, null, and empty-string values; includes 0 and false.
 * Returns "?key=val&..." or "" when nothing to include.
 */
export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      q.set(key, String(value))
    }
  }
  const qs = q.toString()
  return qs ? `?${qs}` : ""
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

function jwtSecondsRemaining(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number }
    if (!payload.exp) return -1
    return payload.exp - Math.floor(Date.now() / 1000)
  } catch {
    return -1 // unparseable or tampered — treat as expired
  }
}

function isJwtExpired(token: string): boolean {
  return jwtSecondsRemaining(token) <= 0
}

if (typeof window !== "undefined") {
  const persisted = loadAuthSession()
  if (persisted?.token) {
    if (isJwtExpired(persisted.token)) {
      clearAuthSession()
    } else {
      _accessToken = persisted.token
    }
  }
}

export function setAccessToken(token: string | null): void {
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

// ── Error reporting (fire-and-forget) ─────────────────────────────────────────
// Lazy-imports errorStore to avoid circular dependencies.

function reportApiError(
  path: string,
  status: number,
  message: string,
  category: "api" | "auth" | "network" = "api"
): void {
  try {
    // Dynamic import keeps api-client independent of React/error-store at load time
    void import("@/src/lib/error-store").then(({ errorStore }) => {
      const severity =
        category === "network"
          ? ("critical" as const)
          : category === "auth"
            ? ("high" as const)
            : status >= 500
              ? ("high" as const)
              : status === 403
                ? ("medium" as const)
                : ("low" as const)

      errorStore.report({
        severity,
        category,
        message,
        metadata: { apiPath: path, statusCode: status },
      })
    })
  } catch {
    // Never let reporting break the request flow
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
    // Chain catch and finally INLINE (not as side-branches off p).
    // Side-branch `.catch()` / `.finally()` off a rejected promise produce a
    // second unhandled-rejection chain that surfaces as "Uncaught (in promise)"
    // in the browser console. Inline chaining keeps a single promise where all
    // rejections flow through to the caller's own .catch() handler.
    _refreshInFlight = import("@/src/services/auth.service")
      .then(({ AuthService }) => AuthService.refresh())
      .finally(() => {
        _refreshInFlight = null
      })
  }
  return _refreshInFlight
}

// 401 refresh helper — uses shared refreshSession() to avoid concurrent refresh calls
async function tryRefreshAndRetry<T>(path: string, options: RequestInit): Promise<T> {
  // Guests have no access token and no persisted session — skip refresh entirely.
  // Attempting refresh without a cookie causes a "Missing refresh token" error.
  const hadToken = _accessToken != null
  const hasPersistedSession = typeof window !== "undefined" && loadAuthSession() != null
  if (!hadToken && !hasPersistedSession) {
    throw new ApiError(401, "Nicht autorisiert")
  }
  try {
    const tokens = await refreshSession()
    setAccessToken(tokens.accessToken)
    return apiRequest<T>(path, options, true)
  } catch {
    setAccessToken(null)
    clearAuthSession()
    reportApiError(path, 401, "Sitzung abgelaufen", "auth")
    if (hadToken && typeof window !== "undefined") {
      const { toast } = await import("sonner")
      toast.error("Sitzung abgelaufen. Bitte erneut anmelden.")
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

  // Proactive refresh: if the JWT expires within 2 minutes, refresh before sending
  if (_accessToken && !skipRetry && jwtSecondsRemaining(_accessToken) < 120) {
    try {
      const tokens = await refreshSession()
      setAccessToken(tokens.accessToken)
    } catch {
      // ignore — will get 401 and retry normally
    }
  }

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      // Always include cookies so the HttpOnly refreshToken cookie is sent
      credentials: "include",
    })
  } catch (err) {
    // Network failure (offline, DNS, CORS, etc.)
    const msg = err instanceof Error ? err.message : "Netzwerkfehler"
    reportApiError(path, 0, msg, "network")
    throw new ApiError(0, "Netzwerkfehler — bitte Internetverbindung prüfen")
  }

  // 204 No Content
  if (response.status === 204) {
    return null as T
  }

  // 401 Unauthorized — attempt token refresh once
  if (response.status === 401 && !skipRetry) {
    return tryRefreshAndRetry<T>(path, options)
  }

  const body = await response.json()

  if (!response.ok) {
    const message = body?.message ?? `Request failed (${response.status})`
    reportApiError(path, response.status, message)
    throw new ApiError(response.status, message, body)
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

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Netzwerkfehler"
    reportApiError(path, 0, msg, "network")
    throw new ApiError(0, "Netzwerkfehler — bitte Internetverbindung prüfen")
  }

  if (response.status === 204) {
    return null as T
  }

  if (response.status === 401 && !skipRetry) {
    const hadToken = _accessToken != null
    const hasPersistedSession = typeof window !== "undefined" && loadAuthSession() != null
    if (!hadToken && !hasPersistedSession) {
      throw new ApiError(401, "Nicht autorisiert")
    }
    try {
      const tokens = await refreshSession()
      setAccessToken(tokens.accessToken)
      return apiRequestRaw<T>(path, options, true)
    } catch {
      setAccessToken(null)
      clearAuthSession()
      reportApiError(path, 401, "Sitzung abgelaufen", "auth")
      if (hadToken && typeof window !== "undefined") {
        const { toast } = await import("sonner")
        toast.error("Sitzung abgelaufen. Bitte erneut anmelden.")
      }
      throw new ApiError(401, "Sitzung abgelaufen")
    }
  }

  const body = await response.json()

  if (!response.ok) {
    const message = body?.message ?? `Request failed (${response.status})`
    reportApiError(path, response.status, message)
    throw new ApiError(response.status, message, body)
  }

  return body as T
}

// Multipart upload
export async function apiUpload<T>(path: string, form: FormData, skipRetry = false): Promise<T> {
  // Proactive refresh: if the JWT expires within 2 minutes, refresh before sending
  if (_accessToken && !skipRetry && jwtSecondsRemaining(_accessToken) < 120) {
    try {
      const tokens = await refreshSession()
      setAccessToken(tokens.accessToken)
    } catch {
      // ignore — will get 401 and retry normally
    }
  }

  const headers: Record<string, string> = {}

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: form,
      credentials: "include",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Netzwerkfehler"
    reportApiError(path, 0, msg, "network")
    throw new ApiError(0, "Netzwerkfehler — bitte Internetverbindung prüfen")
  }

  if (response.status === 204) {
    return null as T
  }

  // 401 Unauthorized — attempt token refresh once
  if (response.status === 401 && !skipRetry) {
    const hadToken = _accessToken != null
    const hasPersistedSession = typeof window !== "undefined" && loadAuthSession() != null
    if (!hadToken && !hasPersistedSession) {
      throw new ApiError(401, "Nicht autorisiert")
    }
    try {
      const tokens = await refreshSession()
      setAccessToken(tokens.accessToken)
      return apiUpload<T>(path, form, true)
    } catch {
      setAccessToken(null)
      clearAuthSession()
      reportApiError(path, 401, "Sitzung abgelaufen", "auth")
      if (hadToken && typeof window !== "undefined") {
        const { toast } = await import("sonner")
        toast.error("Sitzung abgelaufen. Bitte erneut anmelden.")
      }
      throw new ApiError(401, "Sitzung abgelaufen")
    }
  }

  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? `Upload failed (${response.status})`, body)
  }

  return body.data as T
}

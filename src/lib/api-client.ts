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
  user: User
  portal: AuthPortal
  // token intentionally omitted — access tokens must not be stored in
  // JS-readable storage (XSS risk). A fresh token is always obtained via
  // the HttpOnly refresh cookie on every page load (H-S3).
}

export function saveAuthSession(user: User, portal: AuthPortal): void {
  try {
    window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ user, portal }))
  } catch {
    // sessionStorage may be unavailable (private mode). Session is best-effort;
    // the HttpOnly refresh cookie is the authoritative source of truth.
  }
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
  } catch {
    // sessionStorage may be unavailable (private mode); nothing to remove.
  }
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
// _accessToken lives in module memory for XSS safety (H-S3).
// AuthContext Phase 2 fetches a fresh token via the HttpOnly refresh cookie on
// every page load; no token is ever stored in JS-readable storage.
let _accessToken: string | null = null

// ── Auth generation counter ────────────────────────────────────────────────────
// Increments on every auth state transition (login success, logout, refresh
// failure). Callers that await refreshSession() must capture the generation
// before the await and discard the result if the generation has changed.
// Without this, an in-flight refresh can resolve after logout and restore
// the session via setAccessToken/setUser (lost-logout bug).
let _authGen = 0

export function getAuthGeneration(): number {
  return _authGen
}

export function bumpAuthGeneration(): void {
  _authGen += 1
}

function jwtSecondsRemaining(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number }
    if (!payload.exp) return -1
    return payload.exp - Math.floor(Date.now() / 1000)
  } catch {
    return -1 // unparseable or tampered — treat as expired
  }
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

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

// ── 429 Too Many Requests helper ──────────────────────────────────────────────
// Parses the Retry-After header (RFC 7231: either seconds or an HTTP-date) and
// produces a German-localised ApiError. Callers should invoke this INSTEAD of
// reading the JSON body for a 429 response — some rate-limit responses have
// no body at all (e.g. nginx / edge limiters), so `response.json()` would throw.

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const asSeconds = Number(header)
  if (Number.isFinite(asSeconds) && asSeconds >= 0) return Math.ceil(asSeconds)
  const asDate = Date.parse(header)
  if (!Number.isNaN(asDate)) {
    const delta = Math.ceil((asDate - Date.now()) / 1000)
    return delta > 0 ? delta : 0
  }
  return null
}

function buildRateLimitError(path: string, response: Response): ApiError {
  const retryAfter = parseRetryAfter(response.headers.get("retry-after"))
  const message =
    retryAfter != null
      ? `Zu viele Anfragen — bitte in ${retryAfter}s erneut versuchen.`
      : "Zu viele Anfragen — bitte kurz warten und erneut versuchen."
  reportApiError(path, 429, message)
  return new ApiError(429, message, { retryAfter })
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

// Proactive refresh helper — fires before a request if the JWT is near expiry.
// Only triggers for valid, near-expiry tokens (remaining > 0 && < 2 min).
// Malformed/tampered tokens return -1 and must not trigger a refresh —
// they will 401 normally and be retried via tryRefreshAndRetry.
async function proactiveRefreshIfNeeded(skipRetry: boolean): Promise<void> {
  if (!skipRetry && _accessToken) {
    const remaining = jwtSecondsRemaining(_accessToken)
    if (remaining > 0 && remaining < 120) {
      const gen = _authGen
      try {
        const tokens = await refreshSession()
        // Auth state changed during refresh (logout / new login) — discard.
        if (gen !== _authGen) return
        setAccessToken(tokens.accessToken)
      } catch {
        // ignore — the actual request will handle the 401
      }
    }
  }
}

// 401 refresh helper — uses shared refreshSession() to avoid concurrent refresh calls.
// retryFn is a closure over the original arguments so each caller can re-invoke itself.
async function tryRefreshAndRetry<T>(path: string, retryFn: () => Promise<T>): Promise<T> {
  // Guests have no access token and no persisted session — skip refresh entirely.
  // Attempting refresh without a cookie causes a "Missing refresh token" error.
  const hadToken = _accessToken != null
  const hasPersistedSession = typeof window !== "undefined" && loadAuthSession() != null
  if (!hadToken && !hasPersistedSession) {
    throw new ApiError(401, "Nicht autorisiert")
  }
  const gen = _authGen
  try {
    const tokens = await refreshSession()
    // Auth state changed during refresh (logout / new login) — fail the retry
    // rather than resurrect a stale session.
    if (gen !== _authGen) {
      throw new ApiError(401, "Sitzung abgelaufen")
    }
    setAccessToken(tokens.accessToken)
    return retryFn()
  } catch {
    // Only mutate shared state if this refresh attempt still represents the
    // current auth generation. Otherwise another transition already took over.
    if (gen === _authGen) {
      bumpAuthGeneration()
      setAccessToken(null)
      clearAuthSession()
    }
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

  await proactiveRefreshIfNeeded(skipRetry)

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
    return tryRefreshAndRetry<T>(path, () => apiRequest<T>(path, options, true))
  }

  // 429 Too Many Requests — some rate limiters return no body, so handle before .json()
  if (response.status === 429) {
    throw buildRateLimitError(path, response)
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

  await proactiveRefreshIfNeeded(skipRetry)

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
    return tryRefreshAndRetry<T>(path, () => apiRequestRaw<T>(path, options, true))
  }

  if (response.status === 429) {
    throw buildRateLimitError(path, response)
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
  await proactiveRefreshIfNeeded(skipRetry)

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
    return tryRefreshAndRetry<T>(path, () => apiUpload<T>(path, form, true))
  }

  if (response.status === 429) {
    throw buildRateLimitError(path, response)
  }

  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? `Upload failed (${response.status})`, body)
  }

  return body.data as T
}

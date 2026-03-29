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

// Token store (in-memory, cleared on page refresh)
let _accessToken: string | null = null

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

// Shared in-flight refresh promise — deduplicates concurrent refresh calls.
// Without this, AuthContext's session-restore and a simultaneous 401 retry would
// both call POST /auth/refresh with the same cookie. Refresh-token rotation
// invalidates the cookie on the first use, so the second call would fail and
// either kick the user to home or leave the auth state empty.
type TokensResponse = { accessToken: string; user: unknown; expiresIn: number }

let _refreshInFlight: Promise<TokensResponse> | null = null

export async function refreshSession(): Promise<TokensResponse> {
  if (!_refreshInFlight) {
    const p = import("@/src/services/auth.service").then(({ AuthService }) => AuthService.refresh())
    p.finally(() => {
      _refreshInFlight = null
    })
    _refreshInFlight = p
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
    return tryRefreshAndRetry<T>(path, options)
  }

  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.message ?? `Request failed (${response.status})`,
      body
    )
  }

  return body.data as T
}

// Raw request (no ApiResponse unwrapping)
export async function apiRequestRaw<T>(path: string, options: RequestInit = {}): Promise<T> {
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

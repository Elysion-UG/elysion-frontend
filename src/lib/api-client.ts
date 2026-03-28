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

// 401 refresh helper — dynamic import avoids circular dependency
async function tryRefreshAndRetry<T>(path: string, options: RequestInit): Promise<T> {
  try {
    const { AuthService } = await import("@/src/services/auth.service")
    const tokens = await AuthService.refresh()
    setAccessToken(tokens.token)
    return apiRequest<T>(path, options, true)
  } catch {
    setAccessToken(null)
    const { toast } = await import("sonner")
    toast.error("Sitzung abgelaufen. Bitte erneut anmelden.")
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    throw new ApiError(401, "Sitzung abgelaufen")
  }
}

// Core request function
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false
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
  if (response.status === 401 && !_isRetry) {
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

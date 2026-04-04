import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  ApiError,
  AUTH_SESSION_KEY,
  setAccessToken,
  getAccessToken,
  buildQuery,
  apiRequest,
  apiRequestRaw,
  apiUpload,
} from "./api-client"

// Mock dynamic imports used inside tryRefreshAndRetry to prevent loading the
// full service tree during tests (avoids OOM when running with coverage).
vi.mock("@/src/services/auth.service", () => ({
  AuthService: {
    refresh: vi.fn().mockResolvedValue({ token: "new-refresh-token" }),
  },
}))
vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockFetchResponse(status: number, body: unknown, ok?: boolean): Response {
  const resolvedOk = ok ?? (status >= 200 && status < 300)
  return {
    status,
    ok: resolvedOk,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

// ── buildQuery ────────────────────────────────────────────────────────────────

describe("buildQuery", () => {
  it("returns empty string when all values are undefined", () => {
    expect(buildQuery({ page: undefined, size: undefined })).toBe("")
  })

  it("returns empty string for empty object", () => {
    expect(buildQuery({})).toBe("")
  })

  it("builds a query string for a single param", () => {
    expect(buildQuery({ page: 0 })).toBe("?page=0")
  })

  it("includes 0 and false but skips undefined, null, and empty string", () => {
    expect(buildQuery({ a: 0, b: false, c: undefined, d: null, e: "" })).toBe("?a=0&b=false")
  })

  it("builds a query string for multiple params", () => {
    expect(buildQuery({ page: 1, size: 20, search: "test" })).toBe("?page=1&size=20&search=test")
  })

  it("stringifies numbers and booleans", () => {
    expect(buildQuery({ active: true, count: 42 })).toBe("?active=true&count=42")
  })
})

// ── ApiError ───────────────────────────────────────────────────────────────────

describe("ApiError", () => {
  it("creates error with status and message", () => {
    const err = new ApiError(404, "Not Found", null)
    expect(err.status).toBe(404)
    expect(err.message).toBe("Not Found")
    expect(err instanceof Error).toBe(true)
  })

  it("creates error with body", () => {
    const body = { detail: "Resource not found" }
    const err = new ApiError(404, "Not Found", body)
    expect(err.body).toEqual(body)
  })

  it("sets name to ApiError", () => {
    const err = new ApiError(500, "Server Error")
    expect(err.name).toBe("ApiError")
  })

  it("body defaults to undefined when not provided", () => {
    const err = new ApiError(400, "Bad Request")
    expect(err.body).toBeUndefined()
  })

  it("is instanceof ApiError and Error", () => {
    const err = new ApiError(401, "Unauthorized")
    expect(err instanceof ApiError).toBe(true)
    expect(err instanceof Error).toBe(true)
  })
})

// ── Token store ────────────────────────────────────────────────────────────────

describe("setAccessToken / getAccessToken", () => {
  afterEach(() => {
    setAccessToken(null)
  })

  it("returns null when no token has been set", () => {
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })

  it("stores and retrieves a token", () => {
    setAccessToken("my-secret-token")
    expect(getAccessToken()).toBe("my-secret-token")
  })

  it("replaces a previously set token", () => {
    setAccessToken("first-token")
    setAccessToken("second-token")
    expect(getAccessToken()).toBe("second-token")
  })

  it("clears the token when null is passed", () => {
    setAccessToken("some-token")
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })
})

// ── apiRequest ─────────────────────────────────────────────────────────────────

describe("apiRequest", () => {
  beforeEach(() => {
    setAccessToken(null)
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it("returns data from a successful 200 response", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(200, { data: { id: "123", name: "Test" } }))
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiRequest<{ id: string; name: string }>("/api/v1/items")
    expect(result).toEqual({ id: "123", name: "Test" })
  })

  it("returns null for a 204 No Content response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: vi.fn(),
    })
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiRequest("/api/v1/items/1")
    expect(result).toBeNull()
  })

  it("throws ApiError on 400 Bad Request", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(400, { message: "Validation failed" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequest("/api/v1/items")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Validation failed",
    })
  })

  it("throws ApiError(401) when guest (no token, no session) gets 401 — no refresh attempt", async () => {
    // Guest user: no access token, no persisted session → must NOT call AuthService.refresh
    window.sessionStorage.removeItem(AUTH_SESSION_KEY)
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequest("/api/v1/protected")).rejects.toMatchObject({
      status: 401,
      message: "Nicht autorisiert",
    })
    // fetch was called exactly once — no retry after the 401
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("throws ApiError on 404 Not Found", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(404, { message: "Not Found" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequest("/api/v1/items/999")).rejects.toMatchObject({
      status: 404,
      message: "Not Found",
    })
  })

  it("throws ApiError on 500 with fallback message when body.message is missing", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(500, {}, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequest("/api/v1/items")).rejects.toMatchObject({
      status: 500,
      message: "Request failed (500)",
    })
  })

  it("includes Authorization header when access token is set", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)
    setAccessToken("bearer-token-xyz")

    await apiRequest("/api/v1/items")

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer bearer-token-xyz"
    )
  })

  it("does NOT include Authorization header when no token is set", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequest("/api/v1/public")

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBeUndefined()
  })

  it("always sets Content-Type: application/json", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: null }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequest("/api/v1/items")

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
  })

  it("always sends credentials: include", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: null }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequest("/api/v1/items")

    const [, options] = mockFetch.mock.calls[0]
    expect(options.credentials).toBe("include")
  })

  it("merges custom headers with default headers", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequest("/api/v1/items", {
      headers: { "X-Custom-Header": "custom-value" },
    })

    const [, options] = mockFetch.mock.calls[0]
    const headers = options.headers as Record<string, string>
    expect(headers["X-Custom-Header"]).toBe("custom-value")
    expect(headers["Content-Type"]).toBe("application/json")
  })

  it("custom headers can override Content-Type", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequest("/api/v1/items", {
      headers: { "Content-Type": "text/plain" },
    })

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Content-Type"]).toBe("text/plain")
  })

  it("passes method and body through to fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: { id: "new-1" } }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequest("/api/v1/items", {
      method: "POST",
      body: JSON.stringify({ name: "New Item" }),
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain("/api/v1/items")
    expect(options.method).toBe("POST")
    expect(options.body).toBe(JSON.stringify({ name: "New Item" }))
  })

  it("includes the error body in thrown ApiError", async () => {
    const errorBody = { message: "Conflict", field: "email" }
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(409, errorBody, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequest("/api/v1/items")).rejects.toMatchObject({
      status: 409,
      body: errorBody,
    })
  })
})

// ── apiRequestRaw ──────────────────────────────────────────────────────────────

describe("apiRequestRaw", () => {
  beforeEach(() => {
    setAccessToken(null)
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it("returns the raw body (no .data unwrapping)", async () => {
    const rawBody = { status: "success", message: null, data: { id: "42" } }
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, rawBody))
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiRequestRaw<typeof rawBody>("/api/v1/items")
    expect(result).toEqual(rawBody)
  })

  it("returns null on 204 No Content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: vi.fn(),
    })
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiRequestRaw("/api/v1/items/1")
    expect(result).toBeNull()
  })

  it("throws ApiError on 4xx response", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(403, { message: "Forbidden" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequestRaw("/api/v1/admin")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Forbidden",
    })
  })

  it("throws ApiError on 5xx response", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(503, { message: "Service Unavailable" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequestRaw("/api/v1/items")).rejects.toMatchObject({
      status: 503,
      message: "Service Unavailable",
    })
  })

  it("uses fallback message when body.message is absent on error", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(500, {}, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequestRaw("/api/v1/items")).rejects.toMatchObject({
      status: 500,
      message: "Request failed (500)",
    })
  })

  it("includes Authorization header when token is set", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { ok: true }))
    vi.stubGlobal("fetch", mockFetch)
    setAccessToken("raw-token")

    await apiRequestRaw("/api/v1/items")

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBe("Bearer raw-token")
  })

  it("does NOT include Authorization header without a token", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { ok: true }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequestRaw("/api/v1/items")

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBeUndefined()
  })

  it("sends credentials: include", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { ok: true }))
    vi.stubGlobal("fetch", mockFetch)

    await apiRequestRaw("/api/v1/items")

    const [, options] = mockFetch.mock.calls[0]
    expect(options.credentials).toBe("include")
  })
})

// ── apiUpload ──────────────────────────────────────────────────────────────────

describe("apiUpload", () => {
  beforeEach(() => {
    setAccessToken(null)
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it("returns data on a successful upload", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      mockFetchResponse(200, {
        data: { fileId: "file-abc", url: "https://cdn.example.com/file-abc" },
      })
    )
    vi.stubGlobal("fetch", mockFetch)

    const form = new FormData()
    form.append("file", new Blob(["content"]), "test.jpg")

    const result = await apiUpload<{ fileId: string; url: string }>("/api/v1/files", form)
    expect(result).toEqual({ fileId: "file-abc", url: "https://cdn.example.com/file-abc" })
  })

  it("sends the FormData as the request body", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)

    const form = new FormData()
    form.append("file", new Blob(["data"]), "doc.pdf")

    await apiUpload("/api/v1/files", form)

    const [, options] = mockFetch.mock.calls[0]
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.method).toBe("POST")
  })

  it("does not set Content-Type header (lets browser set multipart boundary)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)

    await apiUpload("/api/v1/files", new FormData())

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Content-Type"]).toBeUndefined()
  })

  it("includes Authorization header when token is set", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)
    setAccessToken("upload-token")

    await apiUpload("/api/v1/files", new FormData())

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBe("Bearer upload-token")
  })

  it("does NOT include Authorization header without a token", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)

    await apiUpload("/api/v1/files", new FormData())

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBeUndefined()
  })

  it("sends credentials: include", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)

    await apiUpload("/api/v1/files", new FormData())

    const [, options] = mockFetch.mock.calls[0]
    expect(options.credentials).toBe("include")
  })

  it("returns null on 204 No Content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: vi.fn(),
    })
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiUpload("/api/v1/files", new FormData())
    expect(result).toBeNull()
  })

  it("throws ApiError on upload failure (4xx)", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(422, { message: "File too large" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiUpload("/api/v1/files", new FormData())).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "File too large",
    })
  })

  it("throws ApiError on upload failure (5xx) with fallback message", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(500, {}, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiUpload("/api/v1/files", new FormData())).rejects.toMatchObject({
      status: 500,
      message: "Upload failed (500)",
    })
  })
})

// ── Regression: guest users must not trigger token refresh on 401 ──────────────
//
// Bug: unauthenticated (guest) users who hit a protected endpoint received a
// runtime ApiError "Missing refresh token" because the 401 interceptor blindly
// called AuthService.refresh() even when no access token / session existed.
// The backend rejected the call because there was no HttpOnly refresh-token
// cookie to send.
//
// Fix: skip the refresh attempt entirely when both _accessToken is null AND
// sessionStorage holds no persisted session — i.e. the user is a guest.

describe("regression — guest user 401 must not attempt token refresh", () => {
  beforeEach(() => {
    setAccessToken(null)
    window.sessionStorage.removeItem(AUTH_SESSION_KEY)
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it("apiRequest: does not call AuthService.refresh for a guest 401", async () => {
    const { AuthService } = await import("@/src/services/auth.service")
    const refreshSpy = vi.spyOn(AuthService, "refresh")

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    )

    await expect(apiRequest("/api/v1/protected")).rejects.toMatchObject({ status: 401 })
    expect(refreshSpy).not.toHaveBeenCalled()
  })

  it("apiRequestRaw: does not call AuthService.refresh for a guest 401", async () => {
    const { AuthService } = await import("@/src/services/auth.service")
    const refreshSpy = vi.spyOn(AuthService, "refresh")

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    )

    await expect(apiRequestRaw("/api/v1/protected")).rejects.toMatchObject({ status: 401 })
    expect(refreshSpy).not.toHaveBeenCalled()
  })

  it("apiRequest: fetch is called exactly once for a guest 401 (no retry)", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequest("/api/v1/protected")).rejects.toMatchObject({ status: 401 })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("apiRequestRaw: fetch is called exactly once for a guest 401 (no retry)", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequestRaw("/api/v1/protected")).rejects.toMatchObject({ status: 401 })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("apiRequest: throws ApiError(401, 'Nicht autorisiert') for a guest 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { message: "x" }, false))
    )

    await expect(apiRequest("/api/v1/protected")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Nicht autorisiert",
    })
  })

  it("apiRequestRaw: throws ApiError(401, 'Nicht autorisiert') for a guest 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { message: "x" }, false))
    )

    await expect(apiRequestRaw("/api/v1/protected")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Nicht autorisiert",
    })
  })
})

// ── apiRequestRaw — success paths ─────────────────────────────────────────────

describe("apiRequestRaw", () => {
  beforeEach(() => {
    setAccessToken(null)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it("returns raw body on 200", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { items: [1, 2, 3] }))
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiRequestRaw("/api/v1/items")
    expect(result).toEqual({ items: [1, 2, 3] })
  })

  it("returns null on 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 204, ok: true, json: vi.fn() }))
    const result = await apiRequestRaw("/api/v1/items/1")
    expect(result).toBeNull()
  })

  it("throws ApiError on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network Error")))
    await expect(apiRequestRaw("/api/v1/items")).rejects.toMatchObject({
      status: 0,
      message: "Netzwerkfehler — bitte Internetverbindung prüfen",
    })
  })

  it("throws ApiError on 500", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse(500, {}, false)))
    await expect(apiRequestRaw("/api/v1/items")).rejects.toMatchObject({ status: 500 })
  })

  it("includes Authorization header when token is set", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, {}))
    vi.stubGlobal("fetch", mockFetch)
    setAccessToken("raw-token")

    await apiRequestRaw("/api/v1/items")

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBe("Bearer raw-token")
  })
})

// ── apiUpload ──────────────────────────────────────────────────────────────────

describe("apiUpload", () => {
  beforeEach(() => {
    setAccessToken(null)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
  })

  it("returns data on 200", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: { id: "f1" } }))
    vi.stubGlobal("fetch", mockFetch)

    const form = new FormData()
    const result = await apiUpload("/api/v1/files", form)
    expect(result).toEqual({ id: "f1" })
  })

  it("throws ApiError on 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(400, { message: "Bad file" }, false))
    )
    const form = new FormData()
    await expect(apiUpload("/api/v1/files", form)).rejects.toMatchObject({
      status: 400,
      message: "Bad file",
    })
  })

  it("throws ApiError on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    await expect(apiUpload("/api/v1/files", new FormData())).rejects.toMatchObject({ status: 0 })
  })

  it("includes Authorization header when token is set", async () => {
    const mockFetch = vi.fn().mockResolvedValue(mockFetchResponse(200, { data: {} }))
    vi.stubGlobal("fetch", mockFetch)
    setAccessToken("upload-token")

    await apiUpload("/api/v1/files", new FormData())

    const [, options] = mockFetch.mock.calls[0]
    expect((options.headers as Record<string, string>)["Authorization"]).toBe("Bearer upload-token")
  })
})

// ── Authenticated user 401 — refresh-and-retry ─────────────────────────────────
//
// These tests cover the tryRefreshAndRetry() happy path and the failure path.
// An authenticated user (has access token) gets a 401 → the client should call
// AuthService.refresh() → on success, retry the request; on failure, throw
// ApiError(401, "Sitzung abgelaufen").

describe("authenticated user 401 — refresh-and-retry", () => {
  const refreshedTokensResponse = {
    accessToken: "refreshed-access-token",
    user: { id: "u1", email: "test@example.com", role: "BUYER" as const },
    expiresIn: 3600,
  }

  beforeEach(async () => {
    setAccessToken("valid-but-expired-token")
    vi.stubGlobal("fetch", vi.fn())
    const { AuthService } = await import("@/src/services/auth.service")

    vi.mocked(AuthService.refresh).mockResolvedValue(refreshedTokensResponse as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessToken(null)
    window.sessionStorage.removeItem(AUTH_SESSION_KEY)
  })

  it("apiRequest: network failure throws ApiError(0)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network Error")))
    await expect(apiRequest("/api/v1/items")).rejects.toMatchObject({
      status: 0,
      message: "Netzwerkfehler — bitte Internetverbindung prüfen",
    })
  })

  it("apiRequest: 401 → refresh succeeds → retries and returns data", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(401, { message: "Unauthorized" }, false))
      .mockResolvedValueOnce(mockFetchResponse(200, { data: { id: "item-1" } }))
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiRequest<{ id: string }>("/api/v1/items")
    expect(result).toEqual({ id: "item-1" })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("apiRequest: 401 → refresh fails → throws ApiError(401, 'Sitzung abgelaufen')", async () => {
    const { AuthService } = await import("@/src/services/auth.service")
    vi.mocked(AuthService.refresh).mockRejectedValue(new Error("Refresh failed"))

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    )

    await expect(apiRequest("/api/v1/items")).rejects.toMatchObject({
      status: 401,
      message: "Sitzung abgelaufen",
    })
  })

  it("apiRequestRaw: 401 → refresh succeeds → retries and returns raw body", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(401, { message: "Unauthorized" }, false))
      .mockResolvedValueOnce(mockFetchResponse(200, { items: [1, 2, 3] }))
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiRequestRaw<{ items: number[] }>("/api/v1/items")
    expect(result).toEqual({ items: [1, 2, 3] })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("apiRequestRaw: 401 → refresh fails → throws ApiError(401, 'Sitzung abgelaufen')", async () => {
    const { AuthService } = await import("@/src/services/auth.service")
    vi.mocked(AuthService.refresh).mockRejectedValue(new Error("Refresh failed"))

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    )

    await expect(apiRequestRaw("/api/v1/items")).rejects.toMatchObject({
      status: 401,
      message: "Sitzung abgelaufen",
    })
  })

  it("apiUpload: 401 → refresh succeeds → retries and returns data", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(401, { message: "Unauthorized" }, false))
      .mockResolvedValueOnce(mockFetchResponse(200, { data: { fileId: "f1" } }))
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiUpload<{ fileId: string }>("/api/v1/files", new FormData())
    expect(result).toEqual({ fileId: "f1" })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("apiUpload: 401 → refresh fails → throws ApiError(401, 'Sitzung abgelaufen')", async () => {
    const { AuthService } = await import("@/src/services/auth.service")
    vi.mocked(AuthService.refresh).mockRejectedValue(new Error("Refresh failed"))

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    )

    await expect(apiUpload("/api/v1/files", new FormData())).rejects.toMatchObject({
      status: 401,
      message: "Sitzung abgelaufen",
    })
  })

  it("apiUpload: guest with persisted session, 401 → refresh succeeds → retries", async () => {
    // No access token but has a persisted session (e.g. after page reload before Phase 2)
    setAccessToken(null)
    window.sessionStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ user: { id: "u1", email: "a@b.com", role: "BUYER" }, portal: "customer" })
    )

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(401, { message: "Unauthorized" }, false))
      .mockResolvedValueOnce(mockFetchResponse(200, { data: { fileId: "f2" } }))
    vi.stubGlobal("fetch", mockFetch)

    const result = await apiUpload<{ fileId: string }>("/api/v1/files", new FormData())
    expect(result).toEqual({ fileId: "f2" })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

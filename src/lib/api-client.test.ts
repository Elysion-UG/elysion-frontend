import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  ApiError,
  setAccessToken,
  getAccessToken,
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

  it("throws ApiError on 401 Unauthorized", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(401, { message: "Unauthorized" }, false))
    vi.stubGlobal("fetch", mockFetch)

    await expect(apiRequest("/api/v1/protected")).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    })
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

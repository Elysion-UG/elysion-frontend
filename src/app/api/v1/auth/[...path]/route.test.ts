import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

import { POST } from "./route"

/**
 * Tests for the auth proxy's client IP forwarding (#32).
 *
 * The proxy must never relay the raw, client-controlled X-Forwarded-For
 * chain to the backend — only the platform-verified client IP — and must
 * authenticate it with the shared proxy secret when configured.
 */

function makeRequest(headers: Record<string, string>, body = '{"email":"a@b.de"}'): NextRequest {
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
  return {
    url: "http://localhost:3000/api/v1/auth/customer/login",
    method: "POST",
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
    text: async () => body,
  } as unknown as NextRequest
}

function mockUpstream(): ReturnType<typeof vi.fn> {
  const mockFetch = vi.fn().mockResolvedValue({
    status: 200,
    text: async () => '{"status":"success"}',
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
      getSetCookie: () => [],
    },
  })
  vi.stubGlobal("fetch", mockFetch)
  return mockFetch
}

async function invokeProxy(headers: Record<string, string>) {
  const mockFetch = mockUpstream()
  await POST(makeRequest(headers), {
    params: Promise.resolve({ path: ["customer", "login"] }),
  })
  expect(mockFetch).toHaveBeenCalledTimes(1)
  const outgoingHeaders = mockFetch.mock.calls[0][1].headers as Record<string, string>
  expect(outgoingHeaders).toBeDefined()
  return outgoingHeaders
}

describe("auth proxy client IP forwarding", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv("API_URL", "http://backend.test")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("forwards only the platform client IP, not the client-supplied chain", async () => {
    const headers = await invokeProxy({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "6.6.6.6, 203.0.113.10",
    })

    expect(headers["X-Forwarded-For"]).toBe("203.0.113.10")
    expect(headers["X-Client-IP"]).toBe("203.0.113.10")
  })

  it("falls back to the LAST x-forwarded-for entry (platform-appended) when x-real-ip is missing", async () => {
    const headers = await invokeProxy({
      "x-forwarded-for": "6.6.6.6, 203.0.113.20",
    })

    expect(headers["X-Forwarded-For"]).toBe("203.0.113.20")
    expect(headers["X-Client-IP"]).toBe("203.0.113.20")
  })

  it("falls back to loopback when no platform headers are present", async () => {
    const headers = await invokeProxy({})

    expect(headers["X-Forwarded-For"]).toBe("127.0.0.1")
    expect(headers["X-Client-IP"]).toBe("127.0.0.1")
  })

  it("falls through to x-forwarded-for when x-real-ip is an empty string", async () => {
    const headers = await invokeProxy({
      "x-real-ip": "",
      "x-forwarded-for": "203.0.113.30",
    })

    expect(headers["X-Client-IP"]).toBe("203.0.113.30")
  })

  it("falls back to loopback for implausible header values", async () => {
    const headers = await invokeProxy({
      "x-real-ip": "not an ip",
      "x-forwarded-for": "also not an ip",
    })

    expect(headers["X-Forwarded-For"]).toBe("127.0.0.1")
    expect(headers["X-Client-IP"]).toBe("127.0.0.1")
  })

  it("sends the proxy secret header when AUTH_PROXY_SECRET is configured", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", "test-proxy-secret")

    const headers = await invokeProxy({ "x-real-ip": "203.0.113.10" })

    expect(headers["X-Auth-Proxy-Secret"]).toBe("test-proxy-secret")
  })

  it("omits the proxy secret header when AUTH_PROXY_SECRET is not set", async () => {
    const headers = await invokeProxy({ "x-real-ip": "203.0.113.10" })

    expect(headers["X-Auth-Proxy-Secret"]).toBeUndefined()
  })

  it("does not forward a spoofed X-Auth-Proxy-Secret from the client", async () => {
    const headers = await invokeProxy({
      "x-real-ip": "203.0.113.10",
      "x-auth-proxy-secret": "attacker-supplied",
    })

    expect(headers["X-Auth-Proxy-Secret"]).toBeUndefined()
  })
})

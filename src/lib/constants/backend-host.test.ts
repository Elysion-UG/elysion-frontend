import { describe, it, expect } from "vitest"
import { resolveBackendHost, DEFAULT_BACKEND_HOST } from "./backend-host.mjs"

describe("resolveBackendHost (F5, #145)", () => {
  it("returns the explicit NEXT_PUBLIC_BACKEND_HOST when set", () => {
    expect(resolveBackendHost({ NEXT_PUBLIC_BACKEND_HOST: "api.example.com" })).toBe(
      "api.example.com"
    )
  })

  it("falls back to the staging default outside a production deployment", () => {
    expect(resolveBackendHost({})).toBe(DEFAULT_BACKEND_HOST)
    expect(resolveBackendHost({ VERCEL_ENV: "preview" })).toBe(DEFAULT_BACKEND_HOST)
    expect(resolveBackendHost({ VERCEL_ENV: "development" })).toBe(DEFAULT_BACKEND_HOST)
  })

  it("fails fast on a production deployment when the host is unset", () => {
    expect(() => resolveBackendHost({ VERCEL_ENV: "production" })).toThrow(
      /NEXT_PUBLIC_BACKEND_HOST/
    )
  })

  it("prefers the explicit host even on a production deployment", () => {
    expect(
      resolveBackendHost({ VERCEL_ENV: "production", NEXT_PUBLIC_BACKEND_HOST: "api.prod.example" })
    ).toBe("api.prod.example")
  })
})

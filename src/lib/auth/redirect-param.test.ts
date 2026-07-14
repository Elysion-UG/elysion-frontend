import { describe, expect, it } from "vitest"
import { loginPathWithRedirect, readRedirectTarget, sanitizeRedirect } from "./redirect-param"

describe("sanitizeRedirect (#121 — open-redirect guard)", () => {
  it("accepts plain root-relative paths", () => {
    expect(sanitizeRedirect("/orders/123")).toBe("/orders/123")
    expect(sanitizeRedirect("/")).toBe("/")
  })

  it("preserves query and hash on relative paths", () => {
    expect(sanitizeRedirect("/checkout?step=2")).toBe("/checkout?step=2")
    expect(sanitizeRedirect("/orders/123#items")).toBe("/orders/123#items")
  })

  it("rejects empty / missing values", () => {
    expect(sanitizeRedirect(null)).toBeNull()
    expect(sanitizeRedirect(undefined)).toBeNull()
    expect(sanitizeRedirect("")).toBeNull()
  })

  it("rejects absolute URLs (open redirect)", () => {
    expect(sanitizeRedirect("https://evil.com")).toBeNull()
    expect(sanitizeRedirect("http://evil.com/orders")).toBeNull()
    expect(sanitizeRedirect("mailto:foo@bar.com")).toBeNull()
  })

  it("rejects protocol-relative and backslash-smuggled targets", () => {
    expect(sanitizeRedirect("//evil.com")).toBeNull()
    expect(sanitizeRedirect("/\\evil.com")).toBeNull()
    expect(sanitizeRedirect("/\\/evil.com")).toBeNull()
  })

  it("rejects non-relative values that don't start with a slash", () => {
    expect(sanitizeRedirect("orders/123")).toBeNull()
    expect(sanitizeRedirect("javascript:alert(1)")).toBeNull()
  })

  it("rejects values carrying control chars or whitespace", () => {
    expect(sanitizeRedirect("/orders\n/evil")).toBeNull()
    expect(sanitizeRedirect("/orders\t123")).toBeNull()
    expect(sanitizeRedirect("/orders 123")).toBeNull()
    expect(sanitizeRedirect("/\x00/evil")).toBeNull()
  })
})

describe("loginPathWithRedirect", () => {
  it("appends a sanitised, url-encoded redirect param", () => {
    const path = loginPathWithRedirect("/login/seller", "/seller-dashboard")
    const url = new URL(path, "http://x")
    expect(url.pathname).toBe("/login/seller")
    expect(url.searchParams.get("redirect")).toBe("/seller-dashboard")
  })

  it("returns the bare login path for unsafe targets", () => {
    expect(loginPathWithRedirect("/login/admin", "https://evil.com")).toBe("/login/admin")
    expect(loginPathWithRedirect("/login/admin", null)).toBe("/login/admin")
  })

  it("does not add a redundant self-redirect", () => {
    expect(loginPathWithRedirect("/login/seller", "/login/seller")).toBe("/login/seller")
  })
})

describe("readRedirectTarget", () => {
  it("returns the sanitised target from a query string", () => {
    expect(readRedirectTarget("?redirect=%2Forders%2F123", "/fallback")).toBe("/orders/123")
  })

  it("falls back when the param is absent", () => {
    expect(readRedirectTarget("?foo=bar", "/dashboard")).toBe("/dashboard")
    expect(readRedirectTarget("", "/dashboard")).toBe("/dashboard")
  })

  it("falls back when the param is an unsafe target", () => {
    expect(readRedirectTarget("?redirect=https://evil.com", "/dashboard")).toBe("/dashboard")
    expect(readRedirectTarget("?redirect=//evil.com", "/dashboard")).toBe("/dashboard")
  })

  it("accepts a URLSearchParams instance", () => {
    const params = new URLSearchParams({ redirect: "/profil" })
    expect(readRedirectTarget(params, "/")).toBe("/profil")
  })
})

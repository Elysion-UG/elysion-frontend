import { describe, it, expect } from "vitest"
import { isSafeHttpUrl, safeHttpUrl } from "./safe-url"

describe("isSafeHttpUrl", () => {
  it("accepts https URLs", () => {
    expect(isSafeHttpUrl("https://example.com/cert.pdf")).toBe(true)
  })

  it("accepts http URLs (local/dev document hosts)", () => {
    expect(isSafeHttpUrl("http://localhost:9000/cert.pdf")).toBe(true)
  })

  it("rejects javascript: URLs", () => {
    expect(isSafeHttpUrl("javascript:alert(document.cookie)")).toBe(false)
  })

  it("rejects javascript: URLs regardless of casing/whitespace", () => {
    expect(isSafeHttpUrl("  JavaScript:alert(1)")).toBe(false)
  })

  it("rejects data: URLs", () => {
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false)
  })

  it("rejects vbscript: URLs", () => {
    expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false)
  })

  it("rejects http(s) URLs with embedded credentials", () => {
    expect(isSafeHttpUrl("https://user:pass@evil.com/cert.pdf")).toBe(false)
    expect(isSafeHttpUrl("https://user@evil.com/cert.pdf")).toBe(false)
  })

  it("rejects file: and blob: schemes", () => {
    expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false)
    expect(isSafeHttpUrl("blob:https://example.com/uuid")).toBe(false)
  })

  it("accepts uppercase scheme (normalised by the URL parser)", () => {
    expect(isSafeHttpUrl("HTTPS://example.com/cert.pdf")).toBe(true)
  })

  it("rejects relative paths without a scheme", () => {
    expect(isSafeHttpUrl("/cert.pdf")).toBe(false)
  })

  it("rejects malformed input", () => {
    expect(isSafeHttpUrl("not a url")).toBe(false)
  })

  it("rejects empty, null and undefined", () => {
    expect(isSafeHttpUrl("")).toBe(false)
    expect(isSafeHttpUrl(null)).toBe(false)
    expect(isSafeHttpUrl(undefined)).toBe(false)
  })
})

describe("safeHttpUrl", () => {
  it("returns the URL unchanged when safe", () => {
    const url = "https://example.com/cert.pdf"
    expect(safeHttpUrl(url)).toBe(url)
  })

  it("returns null for unsafe schemes", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull()
  })

  it("returns null for null/undefined", () => {
    expect(safeHttpUrl(null)).toBeNull()
    expect(safeHttpUrl(undefined)).toBeNull()
  })
})

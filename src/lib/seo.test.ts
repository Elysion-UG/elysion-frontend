import { describe, it, expect, afterEach, vi } from "vitest"
import { siteUrl, truncate } from "./seo"

describe("truncate", () => {
  it("collapses whitespace and leaves short text unchanged", () => {
    expect(truncate("Hallo   Welt\n\nhier")).toBe("Hallo Welt hier")
  })

  it("truncates overly long text with an ellipsis", () => {
    const result = truncate("a".repeat(200), 20)
    expect(result).toHaveLength(20)
    expect(result.endsWith("…")).toBe(true)
  })
})

describe("siteUrl", () => {
  const original = process.env.NEXT_PUBLIC_BUYER_DOMAIN

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_BUYER_DOMAIN
    else process.env.NEXT_PUBLIC_BUYER_DOMAIN = original
    vi.unstubAllEnvs()
  })

  it("returns an absolute URL when the buyer domain is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_BUYER_DOMAIN", "elysion.example.com")
    expect(siteUrl()?.toString()).toBe("https://elysion.example.com/")
  })

  it("returns undefined when the buyer domain is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_BUYER_DOMAIN", "")
    expect(siteUrl()).toBeUndefined()
  })
})

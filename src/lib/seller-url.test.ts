import { describe, it, expect, beforeEach } from "vitest"
import { sellerUrl, buyerUrl, adminUrl, producerHref } from "./seller-url"

describe("producerHref", () => {
  it("prefers the slug — only it can load the public profile (#104)", () => {
    expect(producerHref({ slug: "alpha-manufaktur", userId: "u1" })).toBe(
      "/producer?slug=alpha-manufaktur"
    )
  })

  it("keeps existing ?id= links working when no slug is known", () => {
    expect(producerHref({ userId: "8f1c2b7e" })).toBe("/producer?id=8f1c2b7e")
  })

  it("falls back to ?id= for a null slug — the seller is not APPROVED (#104)", () => {
    // The profile answers 404 for such a seller, so ?slug= would be a dead link.
    expect(producerHref({ slug: null, userId: "8f1c2b7e" })).toBe("/producer?id=8f1c2b7e")
  })

  it("encodes a slug that needs escaping", () => {
    expect(producerHref({ slug: "a b&c", userId: "u1" })).toBe("/producer?slug=a%20b%26c")
  })

  it("treats an empty slug like a missing one", () => {
    expect(producerHref({ slug: "", userId: "8f1c2b7e" })).toBe("/producer?id=8f1c2b7e")
  })

  it("stays on the /producer route — no /produzenten/{slug}", () => {
    expect(producerHref({ slug: "alpha" })?.startsWith("/producer?")).toBe(true)
  })

  it("encodes the query value", () => {
    expect(producerHref({ userId: "a b&c" })).toBe("/producer?id=a%20b%26c")
  })

  it("returns null when neither slug nor seller id is known", () => {
    expect(producerHref(null)).toBeNull()
    expect(producerHref(undefined)).toBeNull()
    expect(producerHref({})).toBeNull()
    expect(producerHref({ slug: null, userId: null })).toBeNull()
  })
})

describe("sellerUrl", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SELLER_DOMAIN
  })

  it("returns path as-is when NEXT_PUBLIC_SELLER_DOMAIN is not set", () => {
    expect(sellerUrl("/login")).toBe("/login")
    expect(sellerUrl()).toBe("/")
  })

  it("builds https URL for non-localhost domain", () => {
    process.env.NEXT_PUBLIC_SELLER_DOMAIN = "seller.example.com"
    expect(sellerUrl("/dashboard")).toBe("https://seller.example.com/dashboard")
  })

  it("builds http URL for localhost domain", () => {
    process.env.NEXT_PUBLIC_SELLER_DOMAIN = "localhost:3001"
    expect(sellerUrl("/dashboard")).toBe("http://localhost:3001/dashboard")
  })

  it("defaults path to / when no path is given", () => {
    process.env.NEXT_PUBLIC_SELLER_DOMAIN = "seller.example.com"
    expect(sellerUrl()).toBe("https://seller.example.com/")
  })
})

describe("buyerUrl", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_BUYER_DOMAIN
  })

  it("returns path as-is when NEXT_PUBLIC_BUYER_DOMAIN is not set", () => {
    expect(buyerUrl("/shop")).toBe("/shop")
    expect(buyerUrl()).toBe("/")
  })

  it("builds https URL for non-localhost domain", () => {
    process.env.NEXT_PUBLIC_BUYER_DOMAIN = "shop.example.com"
    expect(buyerUrl("/shop")).toBe("https://shop.example.com/shop")
  })

  it("builds http URL for localhost domain", () => {
    process.env.NEXT_PUBLIC_BUYER_DOMAIN = "localhost:3000"
    expect(buyerUrl("/shop")).toBe("http://localhost:3000/shop")
  })
})

describe("adminUrl", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ADMIN_DOMAIN
  })

  it("returns path as-is when NEXT_PUBLIC_ADMIN_DOMAIN is not set", () => {
    expect(adminUrl("/login")).toBe("/login")
    expect(adminUrl()).toBe("/")
  })

  it("builds https URL for non-localhost domain", () => {
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN = "admin.example.com"
    expect(adminUrl("/dashboard")).toBe("https://admin.example.com/dashboard")
  })

  it("builds http URL for localhost domain", () => {
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN = "admin.localhost:3000"
    expect(adminUrl("/dashboard")).toBe("http://admin.localhost:3000/dashboard")
  })

  it("defaults path to / when no path is given", () => {
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN = "admin.example.com"
    expect(adminUrl()).toBe("https://admin.example.com/")
  })
})

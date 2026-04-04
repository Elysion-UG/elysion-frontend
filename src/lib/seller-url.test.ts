import { describe, it, expect, beforeEach } from "vitest"
import { sellerUrl, buyerUrl, adminUrl } from "./seller-url"

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

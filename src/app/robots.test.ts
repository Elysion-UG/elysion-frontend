import { describe, it, expect } from "vitest"
import robots from "./robots"

describe("robots", () => {
  it("allows the storefront root", () => {
    const rule = robots().rules
    const single = Array.isArray(rule) ? rule[0] : rule
    expect(single.allow).toBe("/")
  })

  it("disallows authenticated buyer areas, the portals and the API proxy", () => {
    const rule = robots().rules
    const single = Array.isArray(rule) ? rule[0] : rule
    const disallow = single.disallow as string[]
    expect(disallow).toEqual(
      expect.arrayContaining([
        "/api/",
        "/cart",
        "/checkout",
        "/orders",
        "/admin",
        "/seller-dashboard",
      ])
    )
  })

  it("references the sitemap", () => {
    expect(robots().sitemap).toContain("/sitemap.xml")
  })
})

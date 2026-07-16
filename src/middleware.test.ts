import { beforeAll, describe, expect, it } from "vitest"
import { NextRequest } from "next/server"

import { SESSION_MARKER_COOKIE } from "@/src/lib/auth/session-marker"

/**
 * Tests for the middleware's first-line session gate (#68).
 *
 * The middleware runs its startup domain-config assertion at import time, so
 * the portal domains must be set before the module is (dynamically) imported.
 */
const SELLER_HOST = "seller.localhost:3000"
const ADMIN_HOST = "admin.localhost:3000"
const BUYER_HOST = "localhost:3000"

let middleware: (req: NextRequest) => Response

beforeAll(async () => {
  process.env.SELLER_DOMAIN = SELLER_HOST
  process.env.ADMIN_DOMAIN = ADMIN_HOST
  process.env.BUYER_DOMAIN = BUYER_HOST
  ;({ middleware } = (await import("./middleware")) as unknown as {
    middleware: (req: NextRequest) => Response
  })
})

function request(url: string, host: string, opts: { withMarker?: boolean } = {}): NextRequest {
  const headers = new Headers({ host })
  if (opts.withMarker) headers.set("cookie", `${SESSION_MARKER_COOKIE}=1`)
  return new NextRequest(new URL(url), { headers })
}

function locationOf(res: Response): string | null {
  return res.headers.get("location")
}

/** Parse the Location header into a URL for pathname / query assertions. */
function locationUrl(res: Response): URL {
  const loc = locationOf(res)
  if (!loc) throw new Error("expected a Location header")
  return new URL(loc)
}

describe("middleware session gate (#68)", () => {
  describe("buyer domain", () => {
    it.each(["/checkout", "/orders", "/profil", "/praeferenzen", "/onboarding"])(
      "redirects unauthenticated visitors from %s to the root, preserving it as a return URL (#121)",
      (path) => {
        const res = middleware(request(`http://${BUYER_HOST}${path}`, BUYER_HOST))
        expect(res.status).toBe(307)
        const loc = locationUrl(res)
        expect(loc.origin).toBe(`http://${BUYER_HOST}`)
        expect(loc.pathname).toBe("/")
        expect(loc.searchParams.get("redirect")).toBe(path)
      }
    )

    it("preserves the query string of the original destination in the return URL (#121)", () => {
      const res = middleware(request(`http://${BUYER_HOST}/orders?page=2`, BUYER_HOST))
      expect(locationUrl(res).searchParams.get("redirect")).toBe("/orders?page=2")
    })

    it("lets a visitor with the session marker through to a protected path", () => {
      const res = middleware(
        request(`http://${BUYER_HOST}/checkout`, BUYER_HOST, { withMarker: true })
      )
      expect(locationOf(res)).toBeNull()
    })

    it("never gates public shop pages", () => {
      const res = middleware(request(`http://${BUYER_HOST}/products`, BUYER_HOST))
      expect(locationOf(res)).toBeNull()
    })

    it("keeps the cart guest-accessible (not gated)", () => {
      const res = middleware(request(`http://${BUYER_HOST}/cart`, BUYER_HOST))
      expect(locationOf(res)).toBeNull()
    })
  })

  describe("seller domain", () => {
    it("redirects unauthenticated visitors from /seller-dashboard to the seller login with a return URL (#121)", () => {
      const res = middleware(request(`http://${SELLER_HOST}/seller-dashboard`, SELLER_HOST))
      expect(res.status).toBe(307)
      const loc = locationUrl(res)
      expect(loc.origin).toBe(`http://${SELLER_HOST}`)
      expect(loc.pathname).toBe("/login/seller")
      expect(loc.searchParams.get("redirect")).toBe("/seller-dashboard")
    })

    it("lets a marked session reach the seller dashboard", () => {
      const res = middleware(
        request(`http://${SELLER_HOST}/seller-dashboard`, SELLER_HOST, { withMarker: true })
      )
      expect(locationOf(res)).toBeNull()
    })

    it("never gates the seller login page itself", () => {
      const res = middleware(request(`http://${SELLER_HOST}/login/seller`, SELLER_HOST))
      expect(locationOf(res)).toBeNull()
    })

    it("sends an unauthenticated root visitor straight to the login in one redirect (#120)", () => {
      const res = middleware(request(`http://${SELLER_HOST}/`, SELLER_HOST))
      expect(res.status).toBe(307)
      expect(locationOf(res)).toBe(`http://${SELLER_HOST}/login/seller`)
    })

    it("sends a marked root visitor to the dashboard", () => {
      const res = middleware(request(`http://${SELLER_HOST}/`, SELLER_HOST, { withMarker: true }))
      expect(res.status).toBe(307)
      expect(locationOf(res)).toBe(`http://${SELLER_HOST}/seller-dashboard`)
    })
  })

  describe("admin domain", () => {
    it("redirects unauthenticated visitors from /admin to the admin login with a return URL (#121)", () => {
      const res = middleware(request(`http://${ADMIN_HOST}/admin`, ADMIN_HOST))
      expect(res.status).toBe(307)
      const loc = locationUrl(res)
      expect(loc.origin).toBe(`http://${ADMIN_HOST}`)
      expect(loc.pathname).toBe("/login/admin")
      expect(loc.searchParams.get("redirect")).toBe("/admin")
    })

    it("lets a marked session reach the admin area", () => {
      const res = middleware(
        request(`http://${ADMIN_HOST}/admin`, ADMIN_HOST, { withMarker: true })
      )
      expect(locationOf(res)).toBeNull()
    })

    it("never gates the admin login page itself", () => {
      const res = middleware(request(`http://${ADMIN_HOST}/login/admin`, ADMIN_HOST))
      expect(locationOf(res)).toBeNull()
    })

    it("sends an unauthenticated root visitor straight to the login in one redirect (#120)", () => {
      const res = middleware(request(`http://${ADMIN_HOST}/`, ADMIN_HOST))
      expect(res.status).toBe(307)
      expect(locationOf(res)).toBe(`http://${ADMIN_HOST}/login/admin`)
    })

    it("sends a marked root visitor to the admin area", () => {
      const res = middleware(request(`http://${ADMIN_HOST}/`, ADMIN_HOST, { withMarker: true }))
      expect(res.status).toBe(307)
      expect(locationOf(res)).toBe(`http://${ADMIN_HOST}/admin`)
    })
  })
})

describe("Content-Security-Policy (#33)", () => {
  function csp(res: Response): string {
    const value = res.headers.get("Content-Security-Policy")
    if (!value) throw new Error("expected a Content-Security-Policy header")
    return value
  }

  it("sets a CSP header on a normal navigation response", () => {
    const res = middleware(request(`http://${BUYER_HOST}/`, BUYER_HOST))
    expect(csp(res)).toContain("default-src 'self'")
  })

  it("splits style-src into granular -elem / -attr directives", () => {
    const policy = csp(middleware(request(`http://${BUYER_HOST}/`, BUYER_HOST)))
    // Radix / recharts inline style ATTRIBUTES stay allowed …
    expect(policy).toContain("style-src-attr 'unsafe-inline'")
    // … inline <style> ELEMENTS are permitted from self + the chart <style>.
    expect(policy).toContain("style-src-elem 'self' 'unsafe-inline'")
    // … and the un-suffixed directive remains as a fallback for old browsers.
    expect(policy).toContain("style-src 'self' 'unsafe-inline'")
  })

  it("keeps img-src free of a wildcard host so inline styles cannot exfiltrate (#33)", () => {
    const policy = csp(middleware(request(`http://${BUYER_HOST}/`, BUYER_HOST)))
    const imgSrc = policy.split(";").find((d) => d.trim().startsWith("img-src")) ?? ""
    expect(imgSrc).not.toContain("*")
    expect(imgSrc).toContain("'self'")
  })

  it("carries a per-request nonce in script-src", () => {
    const policy = csp(middleware(request(`http://${BUYER_HOST}/`, BUYER_HOST)))
    expect(policy).toMatch(/script-src[^;]*'nonce-[a-f0-9]+'/)
  })
})

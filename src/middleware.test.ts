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

describe("middleware session gate (#68)", () => {
  describe("buyer domain", () => {
    it.each(["/checkout", "/orders", "/profil", "/praeferenzen", "/onboarding"])(
      "redirects unauthenticated visitors away from %s",
      (path) => {
        const res = middleware(request(`http://${BUYER_HOST}${path}`, BUYER_HOST))
        expect(res.status).toBe(307)
        expect(locationOf(res)).toBe(`http://${BUYER_HOST}/`)
      }
    )

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
    it("redirects unauthenticated visitors from /seller-dashboard to the seller login", () => {
      const res = middleware(request(`http://${SELLER_HOST}/seller-dashboard`, SELLER_HOST))
      expect(res.status).toBe(307)
      expect(locationOf(res)).toBe(`http://${SELLER_HOST}/login/seller`)
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
    it("redirects unauthenticated visitors from /admin to the admin login", () => {
      const res = middleware(request(`http://${ADMIN_HOST}/admin`, ADMIN_HOST))
      expect(res.status).toBe(307)
      expect(locationOf(res)).toBe(`http://${ADMIN_HOST}/login/admin`)
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

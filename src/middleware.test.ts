import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

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
let PUBLIC_ROUTES: readonly string[]

beforeAll(async () => {
  process.env.SELLER_DOMAIN = SELLER_HOST
  process.env.ADMIN_DOMAIN = ADMIN_HOST
  process.env.BUYER_DOMAIN = BUYER_HOST
  ;({ middleware, PUBLIC_ROUTES } = (await import("./middleware")) as unknown as {
    middleware: (req: NextRequest) => Response
    PUBLIC_ROUTES: readonly string[]
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

  function scriptSrcOf(res: Response): string {
    return (
      csp(res)
        .split(";")
        .find((d) => d.trim().startsWith("script-src")) ?? ""
    )
  }

  it("carries a per-request nonce in script-src on authenticated routes (#37)", () => {
    // A protected buyer route stays dynamically rendered and nonce-based.
    const policy = csp(
      middleware(request(`http://${BUYER_HOST}/orders`, BUYER_HOST, { withMarker: true }))
    )
    expect(policy).toMatch(/script-src[^;]*'nonce-[a-f0-9]+'/)
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'")
  })

  it("serves public shop routes a nonce-free 'unsafe-inline' script-src (#37)", () => {
    // Public routes render statically/ISR — no per-request nonce, so script-src
    // falls back to 'unsafe-inline' (scoped relaxation; see buildCsp).
    for (const path of ["/", "/product", "/about", "/impressum", "/cart"]) {
      const scriptSrc = scriptSrcOf(middleware(request(`http://${BUYER_HOST}${path}`, BUYER_HOST)))
      expect(scriptSrc).toContain("'unsafe-inline'")
      expect(scriptSrc).not.toContain("nonce-")
    }
  })

  it("keeps the nonce on the admin/seller portals even at their root (#37)", () => {
    const adminPolicy = csp(middleware(request(`http://${ADMIN_HOST}/admin`, ADMIN_HOST)))
    expect(adminPolicy).toMatch(/script-src[^;]*'nonce-[a-f0-9]+'/)
  })

  // ── Nonce ist Opt-in (#221) ───────────────────────────────────────────────
  //
  // Die Klassifikation ist invertiert: nicht „alles außer PUBLIC_ROUTES kriegt
  // die Nonce", sondern „nur die authentifizierten Listen kriegen sie". Diese
  // Tests halten die neue Fehlerrichtung fest — unbekannte Pfade rendern das
  // statisch vorgerenderte /_not-found und dürfen deshalb keine Nonce sehen,
  // sonst hydratisiert die 404-Seite nie (FE#23).
  describe("Nonce-Opt-in (#221)", () => {
    it.each(["/_not-found", "/gibt-es-nicht", "/produkte/tippfehler", "/products"])(
      "gibt %s keine Nonce — die Seite wird statisch als /_not-found ausgeliefert",
      (path) => {
        const scriptSrc = scriptSrcOf(
          middleware(request(`http://${BUYER_HOST}${path}`, BUYER_HOST))
        )
        expect(scriptSrc).not.toContain("nonce-")
        expect(scriptSrc).toContain("'unsafe-inline'")
      }
    )

    it("gibt einen unbekannten Pfad auch auf den Portal-Domains keine Nonce", () => {
      // Vor der Inversion bekam auf seller./admin. jeder Pfad eine Nonce, allein
      // wegen der Domain — inklusive des statischen /_not-found.
      for (const host of [SELLER_HOST, ADMIN_HOST]) {
        const scriptSrc = scriptSrcOf(
          middleware(request(`http://${host}/gibt-es-nicht`, host, { withMarker: true }))
        )
        expect(scriptSrc).not.toContain("nonce-")
      }
    })

    it.each([
      [`http://${SELLER_HOST}/seller-dashboard`, SELLER_HOST],
      [`http://${SELLER_HOST}/login/seller`, SELLER_HOST],
      [`http://${ADMIN_HOST}/admin/products`, ADMIN_HOST],
      [`http://${ADMIN_HOST}/login/admin`, ADMIN_HOST],
      [`http://${BUYER_HOST}/checkout`, BUYER_HOST],
      [`http://${BUYER_HOST}/orders/42`, BUYER_HOST],
      [`http://${BUYER_HOST}/profil`, BUYER_HOST],
      [`http://${BUYER_HOST}/praeferenzen`, BUYER_HOST],
      [`http://${BUYER_HOST}/onboarding`, BUYER_HOST],
      [`http://${BUYER_HOST}/reset-password`, BUYER_HOST],
      [`http://${BUYER_HOST}/verify-email`, BUYER_HOST],
    ])("behält die Nonce auf der authentifizierten Route %s", (url, host) => {
      // Alle diese Pfade liegen in force-dynamic-Route-Gruppen ((admin)/(auth)/
      // (buyer)/(seller)) und werden pro Request gerendert — dort kann Next die
      // Nonce in die Bootstrap-Scripts stempeln.
      const scriptSrc = scriptSrcOf(middleware(request(url, host, { withMarker: true })))
      expect(scriptSrc).toMatch(/'nonce-[a-f0-9]+'/)
      expect(scriptSrc).not.toContain("'unsafe-inline'")
    })

    it("verwechselt einen Pfad mit gemeinsamem Präfix nicht mit einer Admin-Route", () => {
      // "/administration" ist keine Route — segmentgenaues Matching verhindert,
      // dass das statische /_not-found doch eine Nonce bekommt.
      const scriptSrc = scriptSrcOf(
        middleware(request(`http://${BUYER_HOST}/administration`, BUYER_HOST))
      )
      expect(scriptSrc).not.toContain("nonce-")
    })
  })

  it("denies framing and upgrades insecure subresources (#172)", () => {
    const policy = csp(middleware(request(`http://${BUYER_HOST}/`, BUYER_HOST)))
    // Modern counterpart to X-Frame-Options: DENY in next.config.mjs.
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("upgrade-insecure-requests")
  })
})

// ── PUBLIC_ROUTES ↔ src/app/(public)/ drift guard (#225, aus #37) ────────────
//
// PUBLIC_ROUTES is a hand-maintained mirror of the (public) route group, and
// nothing enforces the mirroring. Hence this test diffs the list against the
// filesystem in both directions.
//
// Was der Guard seit der Inversion (#221) leistet: PUBLIC_ROUTES entscheidet
// nicht mehr über die CSP — öffentlich ist der Default, eine fehlende Seite in
// der Liste bleibt folgenlos. Teuer ist jetzt die andere Richtung, der UMZUG:
// wandert (public)/x nach (buyer)/x, wird /x eine authentifizierte, dynamisch
// gerenderte URL und muss in BUYER_PROTECTED stehen, sonst verliert sie still
// die strikte Nonce-Policy. Genau das meldet der Stale-Entry-Test unten — der
// zurückgebliebene Eintrag ist das einzige automatische Signal dafür. Damit das
// trägt, muss die Liste vollständig bleiben: eine nie eingetragene Seite kann
// auch keinen Eintrag zurücklassen, wenn sie umzieht. Deshalb bleiben beide
// Richtungen geprüft.
//
// Nicht geprüft (bewusst zurückgestellt, eigenes Issue #235): das Gegenstück
// über src/app/(seller|admin|buyer|auth)/ gegen die authentifizierten Listen,
// das eine vergessene geschützte Route sichtbar machen würde.

// Vitest runs from the project root (vitest.config.ts lives there), so the app
// directory is reachable from cwd.
const PUBLIC_APP_DIR = join(process.cwd(), "src", "app", "(public)")

// Next resolves a route from any of these without extra configuration, so the
// walk must not key on page.tsx alone — a page.js would slip past the guard.
const PAGE_FILES = ["page.tsx", "page.ts", "page.jsx", "page.js"]

type PublicRouteScan = {
  /** URL paths that are actually reachable, "/" for the group root. */
  routes: string[]
  /** Dynamic segments directly below (public) — see the note in scanPublicRoutes. */
  unexpressible: string[]
}

/**
 * Walks src/app/(public)/ and maps every page file to the URL path Next would
 * actually serve. Segment kinds are handled the way the router handles them —
 * a walk that merely approximates them would sign off on the very bug this
 * guard exists to catch:
 *
 *   • "(x)" route groups and "@x" parallel slots contribute NO URL segment.
 *     Appending "@modal" would demand the entry "/@modal/photo" while the real
 *     URL /photo stays unlisted — statically rendered, nonce CSP, FE#23.
 *   • "_x" folders are not routable at all; everything below them is skipped
 *     rather than passed through, which would invent a non-existent route.
 *   • "[x]" directly below (public) has no static ancestor that PUBLIC_ROUTES
 *     could name: a literal "/[slug]" entry never matches in isPublicRoute()
 *     (plain equality / startsWith), so real URLs like /bio-hof-mueller would
 *     get the nonce CSP while the guard reports green. Those are collected as
 *     `unexpressible` and reported as a distinct failure. Nested dynamics such
 *     as /producer/[handle] are fine — the listed "/producer" prefix covers them.
 */
function scanPublicRoutes(dir: string = PUBLIC_APP_DIR, prefix = ""): PublicRouteScan {
  const routes: string[] = []
  const unexpressible: string[] = []

  // The group root itself carries src/app/(public)/page.tsx — the shop home.
  if (PAGE_FILES.some((file) => existsSync(join(dir, file)))) routes.push(prefix || "/")

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const name = entry.name

    // "_x" is not routable in Next — nothing below it becomes a URL.
    if (name.startsWith("_")) continue

    // "(x)" and "@x" contribute no URL segment; the prefix passes through.
    const isTransparent = name.startsWith("(") || name.startsWith("@")

    // A dynamic segment with no static ancestor inside (public): the resulting
    // URL has no literal prefix PUBLIC_ROUTES could carry. Reported separately
    // instead of being passed through as "/[slug]".
    if (name.startsWith("[") && prefix === "") {
      unexpressible.push(`/${name}`)
      continue
    }

    const child = scanPublicRoutes(join(dir, name), isTransparent ? prefix : `${prefix}/${name}`)
    routes.push(...child.routes)
    unexpressible.push(...child.unexpressible)
  }

  return { routes, unexpressible }
}

/** Mirrors the middleware's own prefix matching for a single list entry. */
function covers(entry: string, route: string): boolean {
  return route === entry || route.startsWith(`${entry}/`)
}

describe("PUBLIC_ROUTES mirrors src/app/(public)/ (#225)", () => {
  // Checked before walking: a renamed/moved directory would otherwise throw
  // ENOENT at collection time and take all of middleware.test.ts down with a
  // raw fs error instead of one explanatory failure.
  const publicDirExists = existsSync(PUBLIC_APP_DIR)
  const { routes: discovered, unexpressible } = publicDirExists
    ? scanPublicRoutes()
    : { routes: [], unexpressible: [] }

  it("finds the (public) route group on disk", () => {
    expect(
      publicDirExists,
      `src/app/(public)/ nicht gefunden (${PUBLIC_APP_DIR}). Wurde die Route-Gruppe umbenannt ` +
        "oder verschoben? Dann geht dieser Guard ins Leere — Pfad hier und PUBLIC_ROUTES in " +
        "src/middleware.ts anpassen."
    ).toBe(true)

    // Guards the guard: without a floor near the real count, pages could vanish
    // (or the walk could stop finding them) and the diff below would still pass.
    expect(discovered.length).toBeGreaterThanOrEqual(10)
    expect(discovered).toContain("/")
  })

  it("has no dynamic segment directly below (public) — PUBLIC_ROUTES cannot express those", () => {
    expect(
      unexpressible,
      `Dynamische Segmente direkt unter src/app/(public)/: ${unexpressible.join(", ")}. ` +
        'PUBLIC_ROUTES kann sie nicht ausdrücken — ein Literal-Eintrag wie "/[slug]" matcht ' +
        "keine echte URL. Damit fehlen sie im Inventar, und ein späterer Umzug der Seite in " +
        "eine authentifizierte Route-Gruppe lässt keinen Eintrag zurück, den der Stale-Test " +
        "unten melden könnte. Die Seite unter ein statisches Segment hängen (z. B. " +
        '/producer/[handle], vom Eintrag "/producer" gedeckt).'
    ).toEqual([])
  })

  it("has no bracketed PUBLIC_ROUTES entry (a literal pattern never matches a real URL)", () => {
    // Closes the escape hatch of the two diff tests below: adding "/[slug]" or
    // "/producer/[handle]" to the list would silence them while the list's own
    // matching — plain equality / startsWith — never hits an actual request path.
    const literalPatterns = PUBLIC_ROUTES.filter((entry) => entry.includes("["))

    expect(
      literalPatterns,
      `Diese PUBLIC_ROUTES-Einträge sehen aus wie Route-Patterns: ${literalPatterns.join(", ")}. ` +
        "Die Liste vergleicht Strings, sie matchen also keine einzige echte URL — der " +
        "Eintrag beruhigt nur diesen Test. Stattdessen das statische Elternsegment eintragen."
    ).toEqual([])
  })

  it("lists every page under src/app/(public)/ (incomplete inventory → moves go unnoticed)", () => {
    // "/" is the shop home; the list omits it deliberately (it is never a
    // candidate for a move into an authenticated group).
    const missing = discovered
      .filter((route) => route !== "/")
      .filter((route) => !PUBLIC_ROUTES.some((entry) => covers(entry, route)))

    expect(
      missing,
      `Diese (public)-Seiten fehlen in PUBLIC_ROUTES (src/middleware.ts): ${missing.join(", ")}. ` +
        "Seit #221 bekommen sie dadurch nicht mehr die falsche CSP — aber eine Seite, die nie " +
        "im Inventar stand, hinterlässt beim Umzug in eine authentifizierte Route-Gruppe auch " +
        "keinen Eintrag, den der Stale-Test melden könnte. Die Lücke entwertet den Guard."
    ).toEqual([])
  })

  it("has no entry without a matching directory (stale entry → moved page without nonce)", () => {
    const stale = PUBLIC_ROUTES.filter((entry) => !discovered.some((route) => covers(entry, route)))

    expect(
      stale,
      `Diese PUBLIC_ROUTES-Einträge haben keine Seite unter src/app/(public)/ mehr: ${stale.join(", ")}. ` +
        "Der teure Fall ist der Umzug: Wandert (public)/x nach (buyer)/x, bleibt /x eine gültige — " +
        "jetzt authentifizierte und dynamisch gerenderte — URL. Sie bekommt seit #221 nur dann die " +
        "strikte Nonce-Policy, wenn sie in BUYER_PROTECTED (bzw. der passenden Portal-Liste) steht. " +
        "Also: Eintrag hier entfernen UND die Route in die authentifizierte Liste aufnehmen — sonst " +
        "läuft sie dauerhaft mit script-src 'unsafe-inline'."
    ).toEqual([])
  })
})

// ── Startup drift guard (#168) ───────────────────────────────────────────────
//
// The middleware runs assertDomainConfig() at import time. It must fail loudly
// when a NEXT_PUBLIC_ portal domain drifts from its server counterpart, instead
// of letting seller-url.ts silently fall back to relative redirect paths.

describe("startup domain-config drift guard (#168)", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SELLER_DOMAIN
    delete process.env.NEXT_PUBLIC_ADMIN_DOMAIN
    delete process.env.NEXT_PUBLIC_BUYER_DOMAIN
    vi.resetModules()
  })

  function importMiddlewareFresh() {
    vi.resetModules()
    return import("./middleware")
  }

  it("throws when a NEXT_PUBLIC_ domain drifts from its server value", async () => {
    // Server hosts come from the top-level beforeAll; drift only the client one.
    process.env.NEXT_PUBLIC_SELLER_DOMAIN = "attacker.example.com"
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN = ADMIN_HOST
    process.env.NEXT_PUBLIC_BUYER_DOMAIN = BUYER_HOST

    await expect(importMiddlewareFresh()).rejects.toThrow(/Drift/i)
  })

  it("does not throw when server and NEXT_PUBLIC_ domains match", async () => {
    process.env.NEXT_PUBLIC_SELLER_DOMAIN = SELLER_HOST
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN = ADMIN_HOST
    process.env.NEXT_PUBLIC_BUYER_DOMAIN = BUYER_HOST

    await expect(importMiddlewareFresh()).resolves.toBeDefined()
  })
})

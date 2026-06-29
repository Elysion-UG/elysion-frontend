/**
 * Static-Asset-Regression: /icon.svg darf auf keinem Portal von der Middleware
 * abgefangen werden.
 *
 * Hintergrund (siehe HAR-Analyse 2026-05-24):
 *   Auf admin.localhost / seller.localhost galten Assets in /public als
 *   "kein Portal-Path" und wurden via 307 auf die Buyer-Domain umgeleitet —
 *   für jedes Page-Load wurden so 50+ sinnlose Requests generiert.
 *
 * Wir prüfen über einen echten Browser-Context, da `playwrightRequest` Node's
 * DNS-Resolver nutzt und `*.localhost` unter Windows nicht auflöst. Die Browser
 * dagegen behandeln *.localhost RFC-konform als 127.0.0.1.
 */
import { test, expect } from "@playwright/test"

const PORTALS = [
  { name: "buyer", origin: "http://localhost:3000" },
  { name: "seller", origin: "http://seller.localhost:3000" },
  { name: "admin", origin: "http://admin.localhost:3000" },
]

test.describe.configure({ mode: "serial" })

test.describe("Static assets – kein Middleware-Redirect", () => {
  for (const portal of PORTALS) {
    test(`${portal.name}: GET /icon.svg liefert 200 ohne Redirect`, async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()

      // Erfasst alle Redirects in der Redirect-Chain für /icon.svg.
      const iconRedirects: { from: string; status: number; to: string | null }[] = []
      page.on("response", (res) => {
        const url = res.url()
        if (/\/icon[\w.-]*\.(svg|png)/.test(url)) {
          const status = res.status()
          if (status >= 300 && status < 400) {
            iconRedirects.push({
              from: url,
              status,
              to: res.headers()["location"] ?? null,
            })
          }
        }
      })

      const response = await page.goto(`${portal.origin}/icon.svg`)
      expect(response, `Page-Response für ${portal.origin}/icon.svg ist null`).not.toBeNull()
      expect(response!.status(), `Status für ${portal.origin}/icon.svg`).toBe(200)
      expect(response!.headers()["content-type"] ?? "").toMatch(/image\/svg/i)
      expect(
        iconRedirects,
        `Unerwartete Redirects in der Chain: ${JSON.stringify(iconRedirects)}`
      ).toEqual([])

      await ctx.close()
    })
  }

  test("Page-Load auf admin.localhost erzeugt keine /icon.* Redirect-Schleife", async ({
    browser,
  }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    const iconRedirects: { url: string; status: number; location: string | null }[] = []
    page.on("response", (res) => {
      const url = res.url()
      if (/\/icon[\w.-]*\.(svg|png)/.test(url)) {
        const status = res.status()
        if (status >= 300 && status < 400) {
          iconRedirects.push({
            url,
            status,
            location: res.headers()["location"] ?? null,
          })
        }
      }
    })

    // Login-Page ist öffentlich, kein Auth-State nötig — der Bug hängt nicht
    // vom Login ab, sondern an der Middleware-Konfiguration.
    await page.goto("http://admin.localhost:3000/login/admin", { waitUntil: "domcontentloaded" })
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {
      // networkidle kann bei dev-server-HMR nie erreichen — best effort.
    })

    expect(
      iconRedirects,
      `Icon-Redirects entdeckt: ${JSON.stringify(iconRedirects, null, 2)}`
    ).toEqual([])

    await ctx.close()
  })
})

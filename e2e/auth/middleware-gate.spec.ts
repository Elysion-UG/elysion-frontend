import { test, expect } from "@playwright/test"

/**
 * Serverseitige Auth-Schicht — First Line of Defence (#68).
 *
 * Läuft im `chromium`-Projekt ohne storageState (unauthentifiziert). Prüft, dass
 * die Middleware Besucher ohne `session_present`-Marker von geschützten Routen
 * auf die jeweilige Login-Seite umleitet — bevor eine geschützte Seite rendert.
 *
 * Absolute URLs, weil die drei Portale eigene Subdomains haben.
 */

const BUYER = "http://localhost:3000"
const SELLER = "http://seller.localhost:3000"
const ADMIN = "http://admin.localhost:3000"

test.describe("Middleware – Session-Gate (#68)", () => {
  for (const path of ["/checkout", "/orders", "/profil", "/praeferenzen", "/onboarding"]) {
    test(`Buyer: ${path} leitet unauthentifiziert auf die Startseite/Login um`, async ({
      page,
    }) => {
      await page.goto(`${BUYER}${path}`)
      await expect(page).toHaveURL(`${BUYER}/`, { timeout: 10_000 })
    })
  }

  test("Seller: /seller-dashboard leitet unauthentifiziert auf /login/seller um", async ({
    page,
  }) => {
    await page.goto(`${SELLER}/seller-dashboard`)
    await expect(page).toHaveURL(`${SELLER}/login/seller`, { timeout: 10_000 })
  })

  test("Admin: /admin leitet unauthentifiziert auf /login/admin um", async ({ page }) => {
    await page.goto(`${ADMIN}/admin`)
    await expect(page).toHaveURL(`${ADMIN}/login/admin`, { timeout: 10_000 })
  })

  test("Öffentliche Shop-Seite bleibt ohne Login erreichbar", async ({ page }) => {
    const res = await page.goto(`${BUYER}/products`)
    expect(res?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(`${BUYER}/products`)
  })
})

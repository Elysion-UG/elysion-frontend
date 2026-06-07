/**
 * Stage-Smoke — Basis-Verifikation der Staging-Umgebung (FE#24).
 *
 * Läuft gegen die branch-gebundenen Stage-Domains (echte Deploys, echtes
 * Backend, Seed-Daten). Ziel: Nach jedem Stage-Deploy sicherstellen, dass
 * die Grundfunktionen wirklich laufen — inkl. Hydration (fing den CSP-Bug
 * FE#23, den reine HTTP-Checks übersehen).
 *
 * Rate-Limit-Budget: Backend erlaubt 5 Logins / 15 min pro IP. Dieser Spec
 * macht max. 2 Logins pro Lauf (Seller + Admin); Projekt-Retries sind auf 1
 * begrenzt → worst case 4.
 */
import { test, expect, Page } from "@playwright/test"

const BUYER_URL = process.env.STAGE_BUYER_URL || "https://elysion-stage.vercel.app"
const SELLER_URL = process.env.STAGE_SELLER_URL || "https://elysion-stage-seller.vercel.app"
const ADMIN_URL = process.env.STAGE_ADMIN_URL || "https://elysion-stage-admin.vercel.app"

const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || "seller1@greenthread.dev"
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD || "Seller123!"
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@marketplace.dev"
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin123!"

// Sammelt CSP-Verstöße — die wichtigste Regression aus FE#23.
function collectCspErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
      errors.push(msg.text().slice(0, 200))
    }
  })
  return errors
}

test.describe("Stage-Smoke", () => {
  test("Buyer-Portal: Shop rendert Produkte (Hydration + API + CSP)", async ({ page }) => {
    const cspErrors = collectCspErrors(page)

    await page.goto(BUYER_URL, { waitUntil: "domcontentloaded" })

    // Hydration-Beweis: Das Produktgrid entsteht erst client-seitig nach dem
    // API-Call — der statische "wird geladen"-Platzhalter muss verschwinden.
    await expect(page.getByText("Shop wird geladen")).toBeHidden({ timeout: 30_000 })

    // Mindestens ein Seed-Produkt wird angezeigt (Backend + CORS + Hydration ok).
    // Die Produktkarten navigieren per router.push, daher Text- statt Link-Check.
    await expect(page.getByText("Bio-Baumwoll T-Shirt").first()).toBeVisible({
      timeout: 30_000,
    })

    expect(cspErrors, `CSP-Verstöße auf Buyer-Portal:\n${cspErrors.join("\n")}`).toHaveLength(0)
  })

  test("Seller-Portal: Login mit Seed-Account erreicht das Dashboard", async ({ page }) => {
    const cspErrors = collectCspErrors(page)

    await page.goto(`${SELLER_URL}/login/seller`, { waitUntil: "domcontentloaded" })
    await page.getByPlaceholder("ihre@firma.de").fill(SELLER_EMAIL)
    await page.getByPlaceholder("Passwort").fill(SELLER_PASSWORD)
    await page.getByRole("button", { name: "Anmelden" }).click()

    await page.waitForURL("**/seller-dashboard**", { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Produkte", exact: true })).toBeVisible({
      timeout: 15_000,
    })

    expect(cspErrors, `CSP-Verstöße auf Seller-Portal:\n${cspErrors.join("\n")}`).toHaveLength(0)
  })

  test("Admin-Portal: Login mit Seed-Account erreicht das Admin-Panel", async ({ page }) => {
    const cspErrors = collectCspErrors(page)

    await page.goto(`${ADMIN_URL}/login/admin`, { waitUntil: "domcontentloaded" })
    await page.getByPlaceholder("admin@elysion.de").fill(ADMIN_EMAIL)
    await page.getByPlaceholder("Passwort").fill(ADMIN_PASSWORD)
    await page.getByRole("button", { name: "Anmelden" }).click()

    await page.waitForURL("**/admin/**", { timeout: 30_000 })

    expect(cspErrors, `CSP-Verstöße auf Admin-Portal:\n${cspErrors.join("\n")}`).toHaveLength(0)
  })
})

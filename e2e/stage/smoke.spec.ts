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
// Ausgenommen: Vercels eigene Preview-Tooling-Scripts (vercel.live) — die
// injiziert Vercel in Preview-Deployments, sie sind kein Fehler unserer App.
// (Preview-Feedback ist am Projekt deaktiviert; der Filter sichert gegen
// künftige Vercel-Injektionen ab.)
function collectCspErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      /Content Security Policy/i.test(msg.text()) &&
      !msg.text().includes("vercel.live")
    ) {
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

    await page.goto(`${SELLER_URL}/login/seller`, { waitUntil: "networkidle" })
    await fillStable(page, "ihre@firma.de", SELLER_EMAIL)
    await fillStable(page, "Passwort", SELLER_PASSWORD)
    await page.getByRole("button", { name: "Anmelden" }).click()

    await page.waitForURL("**/seller-dashboard**", { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Produkte", exact: true })).toBeVisible({
      timeout: 15_000,
    })

    expect(cspErrors, `CSP-Verstöße auf Seller-Portal:\n${cspErrors.join("\n")}`).toHaveLength(0)
  })

  test("Admin-Portal: Login mit Seed-Account erreicht das Admin-Panel", async ({ page }) => {
    const cspErrors = collectCspErrors(page)

    await page.goto(`${ADMIN_URL}/login/admin`, { waitUntil: "networkidle" })
    await fillStable(page, "admin@elysion.de", ADMIN_EMAIL)
    await fillStable(page, "Passwort", ADMIN_PASSWORD)
    await page.getByRole("button", { name: "Anmelden" }).click()

    await page.waitForURL("**/admin/**", { timeout: 30_000 })

    expect(cspErrors, `CSP-Verstöße auf Admin-Portal:\n${cspErrors.join("\n")}`).toHaveLength(0)
  })
})

// Hydration-sicheres Ausfüllen: Auf Stage rendert SSR das Formular, bevor
// React hydratisiert — ein zu frühes fill() wird beim Hydratisieren von den
// Controlled-Inputs zurückgesetzt (leerer Submit). Daher: füllen und so lange
// nachprüfen/nachfüllen, bis der Wert stabil im Input steht.
async function fillStable(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.getByPlaceholder(placeholder)
  await expect(input).toBeVisible({ timeout: 15_000 })
  await expect(async () => {
    await input.fill(value)
    await page.waitForTimeout(300)
    await expect(input).toHaveValue(value, { timeout: 1_000 })
  }).toPass({ timeout: 20_000 })
}

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

// Keine Passwort-Fallbacks (FE#65): Die Staging-Passwörter sind von den
// dokumentierten lokalen Seed-Passwörtern entkoppelt und existieren nur als
// GitHub-Secrets (E2E_*_PASSWORD). Eine lokale Kopie gibt es bewusst nicht —
// der früher hier genannte Pfad ~\.elysion\deploy.env existiert nicht mehr.
// Neu rotieren: scripts/rotate-stage-passwords.py im Backend-Repo (FE#106).
// Fehlen die Secrets, werden die Login-Tests übersprungen statt mit eingebauten
// Credentials zu laufen.
const SELLER_EMAIL = process.env.E2E_SELLER_EMAIL || "seller1@greenthread.dev"
const SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@marketplace.dev"
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

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
    test.skip(!SELLER_PASSWORD, "E2E_SELLER_PASSWORD nicht gesetzt — Login-Test übersprungen.")
    const cspErrors = collectCspErrors(page)

    await page.goto(`${SELLER_URL}/login/seller`, { waitUntil: "networkidle" })
    await fillLoginAndSubmit(page, "ihre@firma.de", SELLER_EMAIL, SELLER_PASSWORD!)

    await page.waitForURL("**/seller-dashboard**", { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Produkte", exact: true })).toBeVisible({
      timeout: 15_000,
    })

    expect(cspErrors, `CSP-Verstöße auf Seller-Portal:\n${cspErrors.join("\n")}`).toHaveLength(0)
  })

  test("Admin-Portal: Login mit Seed-Account erreicht das Admin-Panel", async ({ page }) => {
    test.skip(!ADMIN_PASSWORD, "E2E_ADMIN_PASSWORD nicht gesetzt — Login-Test übersprungen.")
    const cspErrors = collectCspErrors(page)

    await page.goto(`${ADMIN_URL}/login/admin`, { waitUntil: "networkidle" })
    await fillLoginAndSubmit(page, "admin@elysion.de", ADMIN_EMAIL, ADMIN_PASSWORD!)

    await page.waitForURL("**/admin/**", { timeout: 30_000 })

    expect(cspErrors, `CSP-Verstöße auf Admin-Portal:\n${cspErrors.join("\n")}`).toHaveLength(0)
  })
})

// Hydration-sicheres Login: Auf Stage rendert SSR das Formular, bevor React
// hydratisiert — ein zu frühes fill() wird beim Hydratisieren von den
// Controlled-Inputs zurückgesetzt (leerer Submit). Ein Per-Feld-Check reicht
// nicht: Wird die E-Mail einzeln verifiziert und DANACH das Passwort gefüllt,
// kann die Hydration die E-Mail in der Lücke wieder leeren (FE#107 — Snapshot
// zeigte leere E-Mail bei gefülltem Passwort → 401). Daher: beide Felder füllen
// und unmittelbar vor dem Submit GEMEINSAM stabil halten, dann erst klicken.
async function fillLoginAndSubmit(
  page: Page,
  emailPlaceholder: string,
  email: string,
  password: string
): Promise<void> {
  const emailInput = page.getByPlaceholder(emailPlaceholder)
  const passwordInput = page.getByPlaceholder("Passwort")
  await expect(emailInput).toBeVisible({ timeout: 15_000 })
  await expect(async () => {
    if ((await emailInput.inputValue()) !== email) await emailInput.fill(email)
    if ((await passwordInput.inputValue()) !== password) await passwordInput.fill(password)
    await page.waitForTimeout(300)
    // Beide Werte müssen GLEICHZEITIG stehen bleiben, sonst nachfüllen.
    await expect(emailInput).toHaveValue(email, { timeout: 1_000 })
    await expect(passwordInput).toHaveValue(password, { timeout: 1_000 })
  }).toPass({ timeout: 20_000 })
  await page.getByRole("button", { name: "Anmelden" }).click()

  // Credentials wurden beim Klick bereits synchron in den Login-Request
  // übernommen. Felder danach leeren, damit ein etwaiger Fehler-Snapshot
  // (Playwrights error-context.md, nur bei Fehlschlag) das Passwort nicht im
  // Klartext leakt (FE#106). Bei erfolgreichem Login navigiert die Seite weg
  // → fill() wirft, was hier bewusst ignoriert wird.
  await passwordInput.fill("").catch(() => {})
  await emailInput.fill("").catch(() => {})
}

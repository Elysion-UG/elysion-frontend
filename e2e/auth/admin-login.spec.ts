/**
 * Admin-Portal Login-Flow E2E.
 *
 * Eigene Login-Seite unter http://admin.localhost:3000/login/admin.
 * Auf Erfolg redirected AdminLogin via window.location.href → /admin/users.
 *
 * Fehlermeldung im Admin-Portal: "Ungültige Anmeldedaten oder fehlende
 * Berechtigung." (anders als Buyer/Seller — kommuniziert dem Admin, dass
 * möglicherweise nur die Rolle fehlt, ohne das Konto preiszugeben).
 *
 * Rate-Limit: siehe Hinweis in buyer-login.spec.ts. Diese Datei macht 3 Logins.
 *
 * REGRESSIONS-SCHUTZ (Bug: Admin wird nach Reload sofort ausgeloggt):
 *  - Erfolgreicher-Login-Test prüft nicht nur die URL, sondern auch dass der
 *    Heading-Inhalt der Admin-Page rendert UND ein Reload die Session nicht
 *    verwirft. Deckt den Fall ab, in dem das Backend bei /auth/refresh
 *    `user: null` zurückgibt und /users/me für ADMIN 403 antwortet — frühere
 *    Version verlor in dem Szenario stillschweigend die Session.
 */
import { test, expect } from "@playwright/test"
import { clearCredentialFields } from "../fixtures/credential-fields"
import { ADMIN, BUYER } from "../fixtures/credentials"

const ADMIN_LOGIN_URL = "http://admin.localhost:3000/login/admin"

// Credentials: e2e/fixtures/credentials.ts (Secret, sonst lokaler Seed-Default).
const INVALID_CREDS_MESSAGE = "Ungültige Anmeldedaten oder fehlende Berechtigung."

async function fillAndSubmit(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto(ADMIN_LOGIN_URL)
  await expect(page.getByRole("heading", { name: "Administrator-Anmeldung" })).toBeVisible()
  const emailInput = page.getByPlaceholder("admin@elysion.de")
  const passwordInput = page.getByPlaceholder("Passwort")
  await emailInput.fill(email)
  await passwordInput.fill(password)
  // Button-Label im Markup: "ANMELDEN" (uppercase). getByRole name matcht
  // case-insensitiv per Substring.
  await page.getByRole("button", { name: "Anmelden" }).click()
  // Siehe e2e/fixtures/credential-fields.ts — Felder nach dem Submit leeren (#106).
  await clearCredentialFields(passwordInput, emailInput)
}

test.describe.configure({ mode: "serial" })

test.describe("Admin – Login", () => {
  test("Erfolgreicher Login rendert Admin-Page und überlebt einen Reload", async ({ page }) => {
    // Schritt 1: Login + Page wird tatsächlich gerendert.
    // Heading-Render bestätigt, dass AdminGuard den User akzeptiert hat und nicht
    // sofort auf "/" umgeleitet wurde. Frühere Version dieses Tests prüfte nur
    // die URL — ein 403 auf /users/me im AuthContext-Fallback hätte den User
    // danach ausgeloggt, ohne dass der Test es bemerkt hätte.
    await fillAndSubmit(page, ADMIN.email, ADMIN.password)
    await page.waitForURL("**/admin/users**", { timeout: 15_000 })
    await expect(page.getByRole("heading", { name: /Benutzerverwaltung/i })).toBeVisible({
      timeout: 10_000,
    })

    // Schritt 2: Reload triggert AuthContext Phase 2 (refresh + ggf. /users/me).
    // Wenn Backend hier user: null + 403 liefert, darf das Frontend die Session
    // nicht verwerfen — der persisted User aus sessionStorage muss reichen.
    const unexpectedNavigations: string[] = []
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url()
        if (/\/login\/admin/.test(url) || /^http:\/\/admin\.localhost:3000\/?$/.test(url)) {
          unexpectedNavigations.push(url)
        }
      }
    })

    await page.reload()
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10_000 })
    await expect(page.getByRole("heading", { name: /Benutzerverwaltung/i })).toBeVisible({
      timeout: 10_000,
    })

    expect(
      unexpectedNavigations,
      `AdminGuard hat die Session nach dem Reload verworfen — Redirects: ${unexpectedNavigations.join(", ")}`
    ).toEqual([])
  })

  test("Falsches Passwort zeigt Fehlermeldung, URL bleibt auf /login/admin", async ({ page }) => {
    await fillAndSubmit(page, ADMIN.email, "FalschesPasswort1!")

    await expect(page.getByText(INVALID_CREDS_MESSAGE)).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/login\/admin/)
  })

  test("Falsches Portal: Buyer-Creds auf Admin-Endpoint → 401/403, gleiche Meldung", async ({
    page,
  }) => {
    // Backend prüft Role auf /api/v1/auth/admin/login → BUYER ohne ADMIN-Role
    // wird abgelehnt. Frontend zeigt aus Security-Gründen die generische
    // "ungültige Anmeldedaten oder fehlende Berechtigung"-Meldung — kein
    // automatischer Redirect zum Buyer-Portal.
    await fillAndSubmit(page, BUYER.email, BUYER.password)

    await expect(page.getByText(INVALID_CREDS_MESSAGE)).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/login\/admin/)
  })

  test("Logout aus dem Admin-Portal → Redirect zu /login/admin", async ({ page }) => {
    // Nutzt eigenen Browser-Context (kein shared admin.json storageState),
    // damit der Logout den globalen Refresh-Cookie für andere Tests nicht
    // invalidiert. Login → Klick auf Abmelden-Button in der Sidebar → URL.
    await fillAndSubmit(page, ADMIN.email, ADMIN.password)
    await page.waitForURL("**/admin/**", { timeout: 15_000 })

    await page.getByRole("button", { name: "Abmelden" }).click()
    await page.waitForURL(/\/login\/admin/, { timeout: 15_000 })
    await expect(page.getByRole("heading", { name: "Administrator-Anmeldung" })).toBeVisible({
      timeout: 10_000,
    })
  })
})

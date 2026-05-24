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
 */
import { test, expect } from "@playwright/test"

const ADMIN_LOGIN_URL = "http://admin.localhost:3000/login/admin"

const ADMIN = { email: "admin@marketplace.dev", password: "Admin123!" }
const BUYER = { email: "buyer1@example.dev", password: "Buyer123!" }
const INVALID_CREDS_MESSAGE = "Ungültige Anmeldedaten oder fehlende Berechtigung."

async function fillAndSubmit(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto(ADMIN_LOGIN_URL)
  await expect(page.getByRole("heading", { name: "Administrator-Anmeldung" })).toBeVisible()
  await page.getByPlaceholder("admin@elysion.de").fill(email)
  await page.getByPlaceholder("Passwort").fill(password)
  // Button-Label im Markup: "ANMELDEN" (uppercase). getByRole name matcht
  // case-insensitiv per Substring.
  await page.getByRole("button", { name: "Anmelden" }).click()
}

test.describe.configure({ mode: "serial" })

test.describe("Admin – Login", () => {
  test("Erfolgreicher Login leitet auf /admin/users weiter", async ({ page }) => {
    await fillAndSubmit(page, ADMIN.email, ADMIN.password)

    await page.waitForURL("**/admin/**", { timeout: 15_000 })
    // Admin-Bereich erreicht — die genaue Landing-Page ist /admin/users.
    await expect(page).toHaveURL(/\/admin\//)
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
})

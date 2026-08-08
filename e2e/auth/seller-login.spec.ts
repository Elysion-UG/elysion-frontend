/**
 * Seller-Portal Login-Flow E2E.
 *
 * Eigene Login-Seite unter http://seller.localhost:3000/login/seller (NICHT Modal).
 * Auf Erfolg redirected SellerLogin via window.location.href → /seller-dashboard.
 * Dashboard-Heading "Produkte" bestätigt vollen Seller-Zugriff (kein Pending-Banner).
 *
 * Rate-Limit: siehe Hinweis in buyer-login.spec.ts. Diese Datei macht 3 Logins.
 */
import { test, expect } from "@playwright/test"
import { clearCredentialFields, fillCredentialField } from "../fixtures/credential-fields"
import { SELLER, BUYER } from "../fixtures/credentials"

const SELLER_LOGIN_URL = "http://seller.localhost:3000/login/seller"

// Credentials: e2e/fixtures/credentials.ts (Secret, sonst lokaler Seed-Default).
const INVALID_CREDS_MESSAGE = "Ungültige Anmeldedaten."

async function fillAndSubmit(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto(SELLER_LOGIN_URL)
  await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible()
  const emailInput = page.getByPlaceholder("ihre@firma.de")
  const passwordInput = page.getByPlaceholder("Passwort")
  // Siehe e2e/fixtures/credential-fields.ts — Felder im `finally` leeren, damit
  // auch ein Timeout im Klick sie nicht im Snapshot stehen lässt (#106).
  try {
    await fillCredentialField(emailInput, email)
    await fillCredentialField(passwordInput, password)
    await page.getByRole("button", { name: "Anmelden" }).click()
  } finally {
    await clearCredentialFields(passwordInput, emailInput)
  }
}

test.describe.configure({ mode: "serial" })

test.describe("Seller – Login", () => {
  test("Erfolgreicher Login leitet auf Seller-Dashboard weiter", async ({ page }) => {
    await fillAndSubmit(page, SELLER.email, SELLER.password)

    await page.waitForURL("**/seller-dashboard**", { timeout: 15_000 })
    // Heading "Produkte" bestätigt Seller-Approval (kein Pending-Konto-Banner).
    await expect(page.getByRole("heading", { name: "Produkte", exact: true })).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Falsches Passwort zeigt Fehlermeldung, URL bleibt auf /login/seller", async ({ page }) => {
    await fillAndSubmit(page, SELLER.email, "FalschesPasswort1!")

    await expect(page.getByText(INVALID_CREDS_MESSAGE, { exact: true })).toBeVisible({
      timeout: 5_000,
    })
    await expect(page).toHaveURL(/\/login\/seller/)
  })

  test("Falsches Portal: Buyer-Creds auf Seller-Endpoint → 401/403, gleiche Meldung", async ({
    page,
  }) => {
    // Backend prüft Role auf /api/v1/auth/seller/login → BUYER ohne SELLER-Role
    // wird abgelehnt. Frontend zeigt aus Security-Gründen dieselbe Meldung wie
    // bei falschem Passwort, kein automatischer Redirect zum Buyer-Portal.
    await fillAndSubmit(page, BUYER.email, BUYER.password)

    await expect(page.getByText(INVALID_CREDS_MESSAGE, { exact: true })).toBeVisible({
      timeout: 5_000,
    })
    await expect(page).toHaveURL(/\/login\/seller/)
  })
})

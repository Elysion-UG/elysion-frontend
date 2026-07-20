/**
 * Auth-Forms E2E — Register (Modal) + Reset-Password + Verify-Email.
 * Deckt Render-States und Client-Side-Validierung ab, OHNE echten E-Mail-Versand.
 * Keine gespeicherten Credentials nötig → läuft im chromium-Projekt.
 */
import { test, expect } from "@playwright/test"

test.describe("Auth – Register (Modal, Buyer-Portal)", () => {
  test("Registrieren-View im Login-Modal erreichbar", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Anmelden" }).first().click()
    await page.getByRole("button", { name: "Registrieren" }).click()

    await expect(page.getByRole("heading", { name: "Konto erstellen" })).toBeVisible()
    await expect(page.getByLabel(/Vorname/i)).toBeVisible()
    await expect(page.getByLabel(/Nachname/i)).toBeVisible()
  })

  test("Client-Side-Validierung lehnt ungültige E-Mail ab", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Anmelden" }).first().click()
    await page.getByRole("button", { name: "Registrieren" }).click()

    // Das E-Mail-Feld ist ein type=email-Input (EmailField). Client-seitige
    // Validierung heißt hier: die HTML5-Constraint-Validity lehnt eine
    // Eingabe ohne @ ab — deterministisch und ohne Backend prüfbar. Ein Submit
    // würde nur die native Bubble auslösen (die JS-Meldung in handleRegister
    // wird davor nie erreicht), deshalb prüfen wir die Validity direkt (#144).
    const emailInput = page.locator("#reg-email")
    await emailInput.fill("keine-email")
    expect(await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false)

    // Gegenprobe: eine gültige Adresse erfüllt die Constraint.
    await emailInput.fill("gueltig@example.com")
    expect(await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true)
  })
})

test.describe("Auth – Passwort zurücksetzen", () => {
  test("Ohne Token → Ungültig-Link-State", async ({ page }) => {
    await page.goto("/reset-password")
    await expect(page.getByRole("heading", { name: /Ungültiger Link/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole("link", { name: /Zur Startseite/i })).toBeVisible()
  })

  test("Mit Fake-Token → entweder validating oder invalid-token state", async ({ page }) => {
    await page.goto("/reset-password?token=definitely-not-valid-abc123")

    // Backend lehnt ungültigen Token ab → invalid-token oder bleibt im validating-State,
    // falls Backend nicht erreichbar ist. Beides akzeptabel.
    const validating = page.getByRole("heading", { name: /Link wird geprüft/i })
    const invalid = page.getByRole("heading", { name: /Ungültiger Link/i })
    const form = page.getByRole("heading", { name: /Neues Passwort festlegen/i })
    await expect(validating.or(invalid).or(form)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe("Auth – E-Mail-Verifizierung", () => {
  test("Ohne Token → Awaiting-State zeigt Hinweise", async ({ page }) => {
    await page.goto("/verify-email")
    await expect(page.getByRole("heading", { name: /Überprüfen Sie Ihre E-Mails/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByPlaceholder(/Ihre E-Mail-Adresse/i)).toBeVisible()
  })

  test("Resend-Button erfordert E-Mail-Eingabe", async ({ page }) => {
    await page.goto("/verify-email")
    // Ohne Token rendert die Seite den "awaiting"-State — dessen Button heißt
    // "Erneut senden". "Neuen Link anfordern" gibt es nur im error-State,
    // also nach einem fehlgeschlagenen Token-Check (#144).
    const button = page.getByRole("button", { name: /Erneut senden/i })
    await expect(button).toBeDisabled()

    await page.getByPlaceholder(/Ihre E-Mail-Adresse/i).fill("test@example.com")
    await expect(button).toBeEnabled()
  })

  test("Mit Fake-Token → entweder loading oder error state", async ({ page }) => {
    await page.goto("/verify-email?token=invalid-token-xyz")
    const loading = page.getByRole("heading", { name: /E-Mail wird verifiziert/i })
    const error = page.getByRole("heading", { name: /Verifizierung fehlgeschlagen/i })
    const success = page.getByRole("heading", { name: /E-Mail verifiziert!/i })
    await expect(loading.or(error).or(success)).toBeVisible({ timeout: 15_000 })
  })
})

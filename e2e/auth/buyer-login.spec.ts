/**
 * Buyer-Portal Login-Flow E2E.
 *
 * Buyer-Login ist ein Modal auf der Shop-Startseite (KEINE eigene /login-Route).
 * Trigger: Navbar-Button "Anmelden" (.first() = Desktop-Nav, sichtbarer Button).
 * Submit: zweiter "Anmelden"-Button (.last() = im Modal-Form).
 *
 * Rate-Limit-Hinweis:
 *   Backend erlaubt 5 Login-Versuche / 15 min pro IP UND pro E-Mail
 *   (app.auth.rate-limit.login-ip.capacity / login-email.capacity).
 *   Diese Datei macht 3 Login-Versuche pro Lauf. Wenn auch seller-login.spec.ts
 *   und admin-login.spec.ts im selben Lauf ausgeführt werden, kommen 9 Versuche
 *   von derselben IP zustande → letzte Tests scheitern mit 429 statt mit der
 *   erwarteten Fehlermeldung. Lösung: pro Portal einzeln laufen lassen, oder
 *   `APP_AUTH_RATE_LIMIT_LOGIN_IP_CAPACITY=100` im Backend setzen.
 */
import { test, expect } from "@playwright/test"
import { clearCredentialFields, fillCredentialField } from "../fixtures/credential-fields"
import { BUYER, SELLER } from "../fixtures/credentials"

// Credentials: e2e/fixtures/credentials.ts (Secret, sonst lokaler Seed-Default).
const INVALID_CREDS_MESSAGE = "Ungültige Anmeldedaten. Bitte versuchen Sie es erneut."

async function openLoginModal(page: import("@playwright/test").Page) {
  await page.goto("/")
  // Navbar enthält den Button doppelt (Desktop + Mobile-Drawer) — .first() ist
  // der sichtbare Desktop-Button.
  await page.getByRole("button", { name: "Anmelden" }).first().click()
  await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible()
}

async function submitLoginForm(page: import("@playwright/test").Page, email: string, pw: string) {
  const emailInput = page.getByPlaceholder("ihre@email.de")
  const passwordInput = page.getByPlaceholder("Passwort")
  // Siehe e2e/fixtures/credential-fields.ts — Felder im `finally` leeren, damit
  // auch ein Timeout im Klick sie nicht im Snapshot stehen lässt (#106).
  try {
    await fillCredentialField(emailInput, email)
    await fillCredentialField(passwordInput, pw)
    // .last() = Submit-Button im Form (der erste war der Navbar-Trigger der schon
    // verarbeitet ist, aber zur Sicherheit den letzten zu nehmen ist robuster
    // falls weitere Anmelden-Buttons gemounted werden).
    await page.getByRole("button", { name: "Anmelden" }).last().click()
  } finally {
    await clearCredentialFields(passwordInput, emailInput)
  }
}

test.describe.configure({ mode: "serial" })

test.describe("Buyer – Login", () => {
  test("Erfolgreicher Login schließt das Modal und etabliert Session", async ({ page }) => {
    await openLoginModal(page)
    await submitLoginForm(page, BUYER.email, BUYER.password)

    // Erfolgs-UX: LoginModal ruft onSuccess → resetAll + onClose
    // → Heading "Willkommen zurück" verschwindet aus dem DOM.
    await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeHidden({
      timeout: 10_000,
    })

    // Buyer bleibt auf "/" — die Navbar zeigt jetzt das Profil-Menü statt
    // "Anmelden". Wir prüfen das negativ: der Anmelden-Button ist weg.
    await expect(page.getByRole("button", { name: "Anmelden" }).first()).toBeHidden({
      timeout: 10_000,
    })
  })

  test("Falsches Passwort zeigt Fehlermeldung, Modal bleibt offen", async ({ page }) => {
    await openLoginModal(page)
    await submitLoginForm(page, BUYER.email, "FalschesPasswort1!")

    await expect(page.getByText(INVALID_CREDS_MESSAGE)).toBeVisible({ timeout: 5_000 })
    // Modal bleibt geöffnet (kein onClose-Call bei Fehler)
    await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible()
  })

  test("Falsches Portal: Seller-Creds auf Customer-Endpoint → 401/403, gleiche Meldung", async ({
    page,
  }) => {
    // Backend erzwingt Portal-Berechtigung: SELLER-User können sich nicht
    // über /api/v1/auth/customer/login anmelden. Frontend zeigt aus
    // Security-Gründen dieselbe generische Meldung wie bei falschem Passwort
    // (kein Account-Existence-Leak, kein automatischer Redirect).
    await openLoginModal(page)
    await submitLoginForm(page, SELLER.email, SELLER.password)

    await expect(page.getByText(INVALID_CREDS_MESSAGE)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible()
  })
})

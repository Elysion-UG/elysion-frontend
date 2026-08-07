/**
 * Buyer Auth Setup — läuft einmal vor allen Buyer-Tests.
 * Öffnet die Shop-Startseite, startet den Login-Modal und meldet den Seed-Buyer an.
 * Speichert den Refresh-Cookie + sessionStorage, damit Folge-Tests ohne erneuten
 * Login auskommen (Backend-Rate-Limit: 5 Versuche / 15 min).
 *
 * Credentials kommen aus e2e/fixtures/credentials.ts (Secret, sonst lokaler
 * Seed-Default) — siehe FE#65 und #144.
 */
import { test as setup } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

import { clearCredentialFields } from "./fixtures/credential-fields"
import { BUYER_WITH_CART } from "./fixtures/credentials"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const BUYER_AUTH_FILE = path.join(__dirname, ".auth/buyer.json")

setup("Buyer Login einmalig durchführen", async ({ page }) => {
  await page.goto("/")

  // Login-Modal über Navbar-Button öffnen. Der Button ist in desktop + mobile
  // Nav je einmal vorhanden — `.first()` nimmt den sichtbaren.
  await page.getByRole("button", { name: "Anmelden" }).first().click()

  // buyer2 hat einen aktiven Warenkorb (siehe CLAUDE.md → Seed-Daten) —
  // ideal für Checkout- und Cart-Tests ohne Vor-Setup pro Lauf.
  const emailInput = page.getByPlaceholder("ihre@email.de")
  const passwordInput = page.getByPlaceholder("Passwort")
  await emailInput.fill(BUYER_WITH_CART.email)
  await passwordInput.fill(BUYER_WITH_CART.password)

  const refreshAfterLogin = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/auth/refresh") &&
      res.request().method() === "POST" &&
      res.status() === 200,
    { timeout: 20_000 }
  )

  // Nach Klick schließt sich der Modal. Wir warten auf den Refresh-Call statt
  // auf einen URL-Wechsel — Buyer bleibt auf / nach dem Login.
  await page.getByRole("button", { name: "Anmelden" }).last().click()
  // Siehe e2e/fixtures/credential-fields.ts — Felder nach dem Submit leeren (#106).
  // Schließt der Modal bereits, wirft fill() und wird verschluckt.
  await clearCredentialFields(passwordInput, emailInput)
  await refreshAfterLogin

  await page.context().storageState({ path: BUYER_AUTH_FILE })
})

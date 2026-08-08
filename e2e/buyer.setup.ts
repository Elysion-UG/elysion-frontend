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

import { clearCredentialFields, fillCredentialField } from "./fixtures/credential-fields"
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

  const refreshAfterLogin = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/auth/refresh") &&
      res.request().method() === "POST" &&
      res.status() === 200,
    { timeout: 20_000 }
  )
  // Siehe auth.setup.ts — Handler gegen unhandled rejection, falls der Login
  // vor dem `await` unten scheitert.
  void refreshAfterLogin.catch(() => {})

  // Siehe e2e/fixtures/credential-fields.ts — Felder im `finally` leeren, damit
  // auch ein Timeout im Klick sie nicht im Snapshot stehen lässt (#106).
  // Ist der Modal beim Leeren schon zu, findet fill("") das Feld nicht mehr und
  // läuft in den kurzen Clear-Timeout; der Fehler wird verschluckt.
  try {
    await fillCredentialField(emailInput, BUYER_WITH_CART.email)
    await fillCredentialField(passwordInput, BUYER_WITH_CART.password)
    // Nach Klick schließt sich der Modal. Wir warten auf den Refresh-Call statt
    // auf einen URL-Wechsel — Buyer bleibt auf / nach dem Login.
    await page.getByRole("button", { name: "Anmelden" }).last().click()
  } finally {
    await clearCredentialFields(passwordInput, emailInput)
  }
  await refreshAfterLogin

  await page.context().storageState({ path: BUYER_AUTH_FILE })
})

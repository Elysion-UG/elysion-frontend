/**
 * Buyer Auth Setup — läuft einmal vor allen Buyer-Tests.
 * Öffnet die Shop-Startseite, startet den Login-Modal und meldet den Seed-Buyer an.
 * Speichert den Refresh-Cookie + sessionStorage, damit Folge-Tests ohne erneuten
 * Login auskommen (Backend-Rate-Limit: 5 Versuche / 15 min).
 */
import { test as setup } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const BUYER_AUTH_FILE = path.join(__dirname, ".auth/buyer.json")

setup("Buyer Login einmalig durchführen", async ({ page }) => {
  await page.goto("http://localhost:3000/")

  // Login-Modal über Navbar-Button öffnen. Der Button ist in desktop + mobile
  // Nav je einmal vorhanden — `.first()` nimmt den sichtbaren.
  await page.getByRole("button", { name: "Anmelden" }).first().click()

  // buyer2 hat einen aktiven Warenkorb (siehe CLAUDE.md → Seed-Daten) —
  // ideal für Checkout- und Cart-Tests ohne Vor-Setup pro Lauf.
  await page.getByPlaceholder("ihre@email.de").fill("buyer2@example.dev")
  await page.getByPlaceholder("Passwort").fill("Buyer123!")

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
  await refreshAfterLogin

  await page.context().storageState({ path: BUYER_AUTH_FILE })
})

/**
 * Auth Setup — läuft einmal vor allen Seller-Tests.
 * Loggt den Seller ein und speichert den Refresh-Cookie (HttpOnly).
 * Alle Seller-Tests laden diesen State und bekommen via Refresh ein frisches Access-Token.
 *
 * Credentials kommen aus e2e/fixtures/credentials.ts (Secret, sonst lokaler
 * Seed-Default) — siehe FE#65 und #144.
 */
import { test as setup } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

import { clearCredentialFields } from "./fixtures/credential-fields"
import { SELLER } from "./fixtures/credentials"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const SELLER_AUTH_FILE = path.join(__dirname, ".auth/seller.json")

setup("Seller Login einmalig durchführen", async ({ page }) => {
  await page.goto("/login/seller")

  const emailInput = page.getByPlaceholder("ihre@firma.de")
  const passwordInput = page.getByPlaceholder("Passwort")
  await emailInput.fill(SELLER.email)
  await passwordInput.fill(SELLER.password)

  // Warte auf die Refresh-Antwort NACH dem Login-Redirect — AuthContext Phase 2
  // ruft /auth/refresh automatisch auf und rotiert den Cookie. Ohne dieses Warten
  // würde storageState den bereits invalidierten (alten) Token speichern.
  const refreshAfterLogin = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/auth/refresh") &&
      res.request().method() === "POST" &&
      res.status() === 200,
    { timeout: 20_000 }
  )

  await page.getByRole("button", { name: "Anmelden" }).click()
  // Credentials sind mit dem Klick im Request — Felder sofort leeren, damit ein
  // Fehler-Snapshot sie nicht im Klartext ins Artefakt schreibt (#106).
  await clearCredentialFields(passwordInput, emailInput)
  await page.waitForURL("**/seller-dashboard**", { timeout: 20_000 })
  await refreshAfterLogin

  // Cookies (inkl. rotiertem Refresh-Token) + localStorage sichern
  await page.context().storageState({ path: SELLER_AUTH_FILE })
})

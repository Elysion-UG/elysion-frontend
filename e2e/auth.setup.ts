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

import { clearCredentialFields, fillCredentialField } from "./fixtures/credential-fields"
import { SELLER } from "./fixtures/credentials"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const SELLER_AUTH_FILE = path.join(__dirname, ".auth/seller.json")

setup("Seller Login einmalig durchführen", async ({ page }) => {
  await page.goto("/login/seller")

  const emailInput = page.getByPlaceholder("ihre@firma.de")
  const passwordInput = page.getByPlaceholder("Passwort")

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
  // Scheitert der Login vorher, wird unten nie awaited — ohne Handler endete das
  // in einer unhandled rejection, die den echten Fehler überdeckt.
  void refreshAfterLogin.catch(() => {})

  // try/finally um Füllen UND Klick: Läuft der Klick in einen Timeout, liefe ein
  // nachgestelltes Leeren nie — das Passwort stünde beim Teardown-Snapshot noch
  // im Feld (#106). Nach dem Klick sind die Werte bereits im Request.
  try {
    await fillCredentialField(emailInput, SELLER.email)
    await fillCredentialField(passwordInput, SELLER.password)
    await page.getByRole("button", { name: "Anmelden" }).click()
  } finally {
    await clearCredentialFields(passwordInput, emailInput)
  }
  await page.waitForURL("**/seller-dashboard**", { timeout: 20_000 })
  await refreshAfterLogin

  // Cookies (inkl. rotiertem Refresh-Token) + localStorage sichern
  await page.context().storageState({ path: SELLER_AUTH_FILE })
})

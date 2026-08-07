/**
 * Admin Auth Setup — läuft einmal vor allen Admin-Tests.
 * Siehe e2e/auth.setup.ts für die Gesamt-Strategie (Refresh-Cookie persistieren).
 *
 * Credentials kommen aus e2e/fixtures/credentials.ts (Secret, sonst lokaler
 * Seed-Default) — siehe FE#65 und #144.
 */
import { test as setup } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

import { clearCredentialFields } from "./fixtures/credential-fields"
import { ADMIN } from "./fixtures/credentials"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ADMIN_AUTH_FILE = path.join(__dirname, ".auth/admin.json")

setup("Admin Login einmalig durchführen", async ({ page }) => {
  await page.goto("/login/admin")

  const emailInput = page.getByPlaceholder("admin@elysion.de")
  const passwordInput = page.getByPlaceholder("Passwort")
  await emailInput.fill(ADMIN.email)
  await passwordInput.fill(ADMIN.password)

  const refreshAfterLogin = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/auth/refresh") &&
      res.request().method() === "POST" &&
      res.status() === 200,
    { timeout: 20_000 }
  )

  await page.getByRole("button", { name: "Anmelden" }).click()
  // Siehe e2e/fixtures/credential-fields.ts — Felder nach dem Submit leeren (#106).
  await clearCredentialFields(passwordInput, emailInput)
  await page.waitForURL("**/admin/**", { timeout: 20_000 })
  await refreshAfterLogin

  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})

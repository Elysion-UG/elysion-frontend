/**
 * Admin Auth Setup — läuft einmal vor allen Admin-Tests.
 * Siehe e2e/auth.setup.ts für die Gesamt-Strategie (Refresh-Cookie persistieren).
 *
 * SECURITY (FE#65): Die hier codierten Credentials sind die LOKALEN
 * Seed-Accounts (docs/seed-data.sql) und gelten nur gegen ein lokales Backend.
 * Auf Staging sind die Passwörter rotiert (nur als Secrets verfügbar); in
 * Produktion dürfen diese Accounts niemals angelegt werden.
 */
import { test as setup } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ADMIN_AUTH_FILE = path.join(__dirname, ".auth/admin.json")

setup("Admin Login einmalig durchführen", async ({ page }) => {
  await page.goto("http://admin.localhost:3000/login/admin")

  await page.getByPlaceholder("admin@elysion.de").fill("admin@marketplace.dev")
  await page.getByPlaceholder("Passwort").fill("Admin123!")

  const refreshAfterLogin = page.waitForResponse(
    (res) =>
      res.url().includes("/api/v1/auth/refresh") &&
      res.request().method() === "POST" &&
      res.status() === 200,
    { timeout: 20_000 }
  )

  await page.getByRole("button", { name: "Anmelden" }).click()
  await page.waitForURL("**/admin/**", { timeout: 20_000 })
  await refreshAfterLogin

  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})

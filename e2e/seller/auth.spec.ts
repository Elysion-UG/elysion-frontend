import { test, expect } from "@playwright/test"

// baseURL + storageState kommen aus playwright.config.ts (seller-Projekt)

test.describe("Seller – Login", () => {
  test("Login-Seite ist erreichbar", async ({ page }) => {
    // Neue Seite ohne gespeicherten Auth-State öffnen
    const context = await page.context().browser()!.newContext()
    const loginPage = await context.newPage()

    await loginPage.goto("http://seller.localhost:3000/login/seller")
    await expect(loginPage.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible()
    await expect(loginPage.getByPlaceholder("ihre@firma.de")).toBeVisible()
    await expect(loginPage.getByPlaceholder("Passwort")).toBeVisible()
    await expect(loginPage.getByRole("button", { name: "Anmelden" })).toBeVisible()

    await context.close()
  })

  test("Eingeloggter Seller landet auf Seller-Dashboard", async ({ page }) => {
    // storageState ist gesetzt → Refresh-Cookie vorhanden → App holt neues Access-Token
    await page.goto("/seller-dashboard")
    await expect(page).toHaveURL(/seller-dashboard/)
    // Produkte-Heading bestätigt echten Seller-Zugang (kein Pending-Banner)
    await expect(page.getByRole("heading", { name: "Produkte", exact: true })).toBeVisible({
      timeout: 8_000,
    })
  })

  test("Falsche Credentials zeigen Fehlermeldung", async ({ page }) => {
    // Eigener Context ohne Auth-State
    const context = await page.context().browser()!.newContext()
    const loginPage = await context.newPage()

    await loginPage.goto("http://seller.localhost:3000/login/seller")
    await loginPage.getByPlaceholder("ihre@firma.de").fill("seller1@greenthread.dev")
    await loginPage.getByPlaceholder("Passwort").fill("FalschesPasswort!")
    await loginPage.getByRole("button", { name: "Anmelden" }).click()

    await expect(loginPage.getByText("Ungültige Anmeldedaten")).toBeVisible({ timeout: 5_000 })
    await expect(loginPage).toHaveURL(/login\/seller/)

    await context.close()
  })

  test("Nicht eingeloggter User sieht Pending-Banner statt Produkte", async ({ page }) => {
    // Eigener Context ohne Auth-State
    const context = await page.context().browser()!.newContext()
    const freshPage = await context.newPage()

    await freshPage.goto("http://seller.localhost:3000/seller-dashboard")
    await expect(freshPage.getByText("Verkäuferkonto wird geprüft")).toBeVisible({
      timeout: 5_000,
    })

    await context.close()
  })
})

import { test, expect } from "@playwright/test"
import { ShopHomePage } from "../pages"

// Öffentlicher Shop-Smoketest ohne Auth — landet im chromium-Projekt
// (testIgnore matches the seller/ folder, not shop/).

test.describe("Public – Shop Smoke", () => {
  test("Startseite lädt ohne Fehler", async ({ page }) => {
    const home = new ShopHomePage(page)
    await home.open()
    await expect(page).toHaveURL(/\/$/)
    // Body muss mindestens einen Heading rendern — fängt White-Screen ab.
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 })
  })

  test("About-Seite ist statisch erreichbar", async ({ page }) => {
    await page.goto("/about")
    await expect(page.getByRole("heading", { name: /Nachhaltigkeit\./ })).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Impressum-Seite ist erreichbar", async ({ page }) => {
    await page.goto("/impressum")
    await expect(page.getByRole("heading", { name: "Impressum" })).toBeVisible({
      timeout: 10_000,
    })
  })
})

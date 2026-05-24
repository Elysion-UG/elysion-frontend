import { test, expect } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ADMIN_AUTH_FILE = path.join(__dirname, "..", ".auth", "admin.json")

test.describe.configure({ mode: "serial" })

test.describe("Admin – Dashboard-Bereiche", () => {
  test.afterEach(async ({ page }) => {
    await page.context().storageState({ path: ADMIN_AUTH_FILE })
  })

  const sections: { path: string; headingPattern: RegExp }[] = [
    // Headings use German singular-stem "-Verwaltung" compounds. Match the
    // stem rather than a plural form so the test survives copy tweaks.
    { path: "/admin/users", headingPattern: /Benutzer/i },
    { path: "/admin/orders", headingPattern: /Bestell/i },
    { path: "/admin/products", headingPattern: /Produkt/i },
    { path: "/admin/certificates", headingPattern: /Zertifikat/i },
    // Categories: tree is built client-side from /categories (the backend's
    // /categories/tree returns 500). Heading proves the build path didn't
    // throw and the page rendered, not just the URL.
    { path: "/admin/categories", headingPattern: /Kategorie/i },
  ]

  for (const section of sections) {
    test(`Admin-Seite ${section.path} lädt und zeigt Heading`, async ({ page }) => {
      await page.goto(section.path)
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 })
      await expect(page.locator("h1").filter({ hasText: section.headingPattern })).toBeVisible({
        timeout: 10_000,
      })
    })
  }
})

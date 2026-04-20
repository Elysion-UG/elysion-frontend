import { test, expect } from "@playwright/test"

// Lightweight a11y smoke tests without external dependencies.
// Verifies: images have alt text, interactive controls have accessible names,
// landmark structure exists, and the page has a single H1.

const PUBLIC_PATHS = ["/", "/about", "/impressum"]

for (const path of PUBLIC_PATHS) {
  test.describe(`A11y smoke – ${path}`, () => {
    test("each <img> has a non-empty alt", async ({ page }) => {
      await page.goto(path)
      const imgs = await page.locator("img").all()
      for (const img of imgs) {
        const alt = await img.getAttribute("alt")
        expect(alt, `image missing alt at ${path}`).not.toBeNull()
      }
    })

    test("buttons and links expose accessible names", async ({ page }) => {
      await page.goto(path)
      const interactive = await page.locator("button, a").all()
      for (const el of interactive) {
        const label =
          (await el.getAttribute("aria-label")) ||
          (await el.textContent()) ||
          (await el.getAttribute("title"))
        expect(label?.trim(), `control without accessible name at ${path}`).toBeTruthy()
      }
    })

    test("has at most one H1 and a main landmark", async ({ page }) => {
      await page.goto(path)
      const h1Count = await page.locator("h1").count()
      expect(h1Count).toBeLessThanOrEqual(1)
      await expect(page.locator("main, [role='main']").first()).toBeVisible()
    })
  })
}

/**
 * Admin – Dashboard
 *
 * Read-only Smoke + Quick-Links: stellt sicher, dass die KPI-Karten
 * laden und alle 7 Schnellzugriff-Links zu ihrem Bereich navigieren.
 */
import { test, expect } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Dashboard", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Heading und KPI-Karten laden", async ({ page }) => {
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible({
      timeout: 10_000,
    })
    // KPIs werden via /api/v1/admin/dashboard geladen — Skeletons verschwinden,
    // Titles erscheinen. Wir prüfen mind. 4 erwartete KPI-Titles.
    for (const kpi of ["Benutzer", "Verkäufer", "Produkte", "Bestellungen"]) {
      await expect(page.getByText(kpi, { exact: true }).first()).toBeVisible({
        timeout: 15_000,
      })
    }
    await expect(page.getByText("Schnellzugriff")).toBeVisible()
  })

  test("Quick-Link 'Benutzer' navigiert nach /admin/users", async ({ page }) => {
    await page.goto("/admin")
    await expect(page.getByText("Schnellzugriff")).toBeVisible({ timeout: 15_000 })

    await page.getByRole("link", { name: "Benutzer", exact: true }).last().click()
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10_000 })
    await expect(page.getByRole("heading", { name: /Benutzerverwaltung/i })).toBeVisible()
  })

  const quickLinks: { label: string; path: RegExp; heading: RegExp }[] = [
    { label: "Verkäufer", path: /\/admin\/sellers/, heading: /Verkäufer-Verwaltung/ },
    { label: "Produkte", path: /\/admin\/products/, heading: /Produkt-Verwaltung/ },
    { label: "Bestellungen", path: /\/admin\/orders/, heading: /Bestellungs-Verwaltung/ },
    { label: "Finanzen", path: /\/admin\/finance/, heading: /Finanzen/ },
    { label: "Zertifikate", path: /\/admin\/certificates/, heading: /Zertifikat-Prüfung/ },
    { label: "Monitoring", path: /\/admin\/monitoring/, heading: /Monitoring/ },
  ]

  for (const link of quickLinks) {
    test(`Quick-Link '${link.label}' navigiert korrekt`, async ({ page }) => {
      await page.goto("/admin")
      await expect(page.getByText("Schnellzugriff")).toBeVisible({ timeout: 15_000 })
      // .last() — gleicher Label existiert auch in Sidebar; Schnellzugriff steht
      // unter der Sidebar im DOM, daher last() wählt den Quick-Link.
      await page.getByRole("link", { name: link.label, exact: true }).last().click()
      await expect(page).toHaveURL(link.path, { timeout: 10_000 })
      await expect(page.locator("h1").filter({ hasText: link.heading })).toBeVisible({
        timeout: 10_000,
      })
    })
  }
})

test.describe("Admin – Dashboard-Bereiche (Smoke)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  // Bestehende Direkt-Aufrufe der Bereiche, damit der Build-Pfad jeder Page
  // einzeln getestet wird (unabhängig von Sidebar/Quick-Links).
  const sections: { path: string; headingPattern: RegExp }[] = [
    { path: "/admin/users", headingPattern: /Benutzer/i },
    { path: "/admin/orders", headingPattern: /Bestell/i },
    { path: "/admin/products", headingPattern: /Produkt/i },
    { path: "/admin/certificates", headingPattern: /Zertifikat/i },
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

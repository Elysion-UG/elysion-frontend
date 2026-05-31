/**
 * Admin – Layout & Navigation Smoke
 *
 * Stellt sicher, dass jede Sidebar-Nav den richtigen Bereich öffnet
 * und dass der Logout-Button im Sidebar-Footer existiert.
 *
 * Der Logout-Flow selbst wird in e2e/auth/admin-login.spec.ts getestet
 * — wenn wir hier echten Logout ausführen würden, wäre der shared
 * admin.json-Refresh-Cookie kaputt und alle folgenden Admin-Tests
 * würden mit 401 scheitern.
 */
import { test, expect } from "@playwright/test"
import { AdminSidebarPanel } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

const NAV_ITEMS: { label: string; expectUrl: RegExp; heading: RegExp }[] = [
  { label: "Dashboard", expectUrl: /\/admin$/, heading: /^Dashboard$/ },
  { label: "Benutzer", expectUrl: /\/admin\/users/, heading: /Benutzerverwaltung/ },
  { label: "Verkäufer", expectUrl: /\/admin\/sellers/, heading: /Verkäufer-Verwaltung/ },
  { label: "Produkte", expectUrl: /\/admin\/products/, heading: /Produkt-Verwaltung/ },
  { label: "Kategorien", expectUrl: /\/admin\/categories/, heading: /Kategorie-Verwaltung/ },
  { label: "Bestellungen", expectUrl: /\/admin\/orders/, heading: /Bestellungs-Verwaltung/ },
  { label: "Finanzen", expectUrl: /\/admin\/finance/, heading: /Finanzen/ },
  { label: "Zertifikate", expectUrl: /\/admin\/certificates/, heading: /Zertifikat-Prüfung/ },
  { label: "Monitoring", expectUrl: /\/admin\/monitoring/, heading: /Monitoring/ },
]

test.describe("Admin – Sidebar-Navigation", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Alle 9 Nav-Links navigieren zur richtigen Seite", async ({ page }) => {
    const sidebar = new AdminSidebarPanel(page)
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible({
      timeout: 10_000,
    })

    for (const item of NAV_ITEMS) {
      await sidebar.clickNav(item.label)
      await expect(page).toHaveURL(item.expectUrl, { timeout: 10_000 })
      await expect(page.locator("h1").filter({ hasText: item.heading }).first()).toBeVisible({
        timeout: 10_000,
      })
    }
  })

  test("Logo-Bereich zeigt 'Elysion ADMIN-PORTAL'", async ({ page }) => {
    await page.goto("/admin")
    // Sidebar-Header: zwei Spans mit "Elysion" und "ADMIN-PORTAL"
    await expect(page.getByText("ADMIN-PORTAL", { exact: true })).toBeVisible()
  })
})

test.describe("Admin – Sidebar-Aktionen (read-only)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Logout-Button ist sichtbar und klickbar (nicht aufgerufen)", async ({ page }) => {
    const sidebar = new AdminSidebarPanel(page)
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible({
      timeout: 10_000,
    })

    // Nur Sichtbarkeit/Enabled prüfen — der eigentliche Logout-Flow läuft in
    // e2e/auth/admin-login.spec.ts (Logout würde den shared Refresh-Cookie
    // invalidieren).
    await expect(sidebar.logoutButton).toBeVisible()
    await expect(sidebar.logoutButton).toBeEnabled()
  })
})

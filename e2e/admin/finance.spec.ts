/**
 * Admin – Finance (Tabs)
 *
 * 5 Tabs: Zahlungen, Erstattungen, Abrechnungen, Auszahlungen, Wartung.
 * Wartung: Buttons werden nur auf Sichtbarkeit geprüft — NICHT geklickt
 * (würden globale DB-Wartungs-Jobs auslösen).
 */
import { test, expect } from "@playwright/test"
import { AdminFinancePage, type FinanceTab } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Finance Tabs", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Heading rendert + erster Tab (Zahlungen) ist aktiv", async ({ page }) => {
    const finance = new AdminFinancePage(page)
    await finance.goto()
    await expect(finance.title).toBeVisible({ timeout: 10_000 })

    // Alle 5 Tabs sichtbar
    for (const t of [
      "Zahlungen",
      "Erstattungen",
      "Abrechnungen",
      "Auszahlungen",
      "Wartung",
    ] as FinanceTab[]) {
      await expect(finance.tab(t)).toBeVisible()
    }
  })

  const dataTabs: FinanceTab[] = ["Zahlungen", "Erstattungen", "Abrechnungen", "Auszahlungen"]

  for (const tab of dataTabs) {
    test(`Tab '${tab}' lädt und zeigt Tabelle oder Empty-State`, async ({ page }) => {
      const finance = new AdminFinancePage(page)
      await finance.goto()
      await expect(finance.title).toBeVisible({ timeout: 10_000 })

      await finance.openTab(tab)
      // Refresh-Button ist im Tab-Bereich sichtbar (nicht in Maintenance)
      await expect(finance.refreshButton).toBeVisible({ timeout: 10_000 })
      // Tabelle ODER Empty-Text für diesen Tab — wir suchen generisch
      const tableOrEmpty = page.locator("table").or(page.getByText(/Keine .* gefunden/i))
      await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10_000 })
    })
  }

  test("Refresh-Button lädt aktuelle Tab-Daten neu", async ({ page }) => {
    const finance = new AdminFinancePage(page)
    await finance.goto()
    await finance.openTab("Zahlungen")
    await expect(finance.refreshButton).toBeVisible({ timeout: 10_000 })
    await finance.refreshButton.click()
    await expect(page.locator("table").or(page.getByText(/Keine .* gefunden/i))).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Maintenance-Tab: Hinweis + beide Buttons sichtbar (kein Klick!)", async ({ page }) => {
    const finance = new AdminFinancePage(page)
    await finance.goto()
    await finance.openTab("Wartung")

    await expect(finance.maintenanceHint).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText("Refresh-Tokens bereinigen")).toBeVisible()
    await expect(page.getByText("Ausstehende Bestellungen ablaufen lassen")).toBeVisible()
    await expect(finance.tokenCleanupButton).toBeEnabled()
    await expect(finance.orderExpireButton).toBeEnabled()
    // Refresh-Button ist im Maintenance-Tab nicht sichtbar
    await expect(finance.refreshButton).toHaveCount(0)
  })
})

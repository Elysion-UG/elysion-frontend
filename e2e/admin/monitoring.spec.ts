/**
 * Admin – Monitoring
 *
 * Frontend-Fehler-Übersicht aus dem in-Memory errorStore.
 * Time-Range-Tabs (1h/6h/24h), Severity-/Category-Filter, Reset-Button.
 *
 * Wir können hier ohne Backend testen — der errorStore ist client-only.
 */
import { test, expect } from "@playwright/test"
import { AdminMonitoringPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Monitoring", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Heading, Health-Cards und Filter-Bereich rendern", async ({ page }) => {
    const mon = new AdminMonitoringPage(page)
    await mon.goto()

    await expect(mon.title).toBeVisible({ timeout: 10_000 })
    await expect(mon.clearButton).toBeVisible()
    await expect(mon.severityFilter).toBeVisible()
    await expect(mon.categoryFilter).toBeVisible()
    await expect(mon.timeRangeButton("1 Std.")).toBeVisible()
    await expect(mon.timeRangeButton("6 Std.")).toBeVisible()
    await expect(mon.timeRangeButton("24 Std.")).toBeVisible()
  })

  test("Zeitbereich-Tabs sind wechselbar", async ({ page }) => {
    const mon = new AdminMonitoringPage(page)
    await mon.goto()
    await expect(mon.title).toBeVisible({ timeout: 10_000 })

    await mon.timeRangeButton("6 Std.").click()
    // Active-State hat bg-cyber-900/60 — wir prüfen via CSS-Klasse
    await expect(mon.timeRangeButton("6 Std.")).toHaveClass(/cyber-900/)

    await mon.timeRangeButton("24 Std.").click()
    await expect(mon.timeRangeButton("24 Std.")).toHaveClass(/cyber-900/)

    await mon.timeRangeButton("1 Std.").click()
    await expect(mon.timeRangeButton("1 Std.")).toHaveClass(/cyber-900/)
  })

  test("Severity-Filter akzeptiert Auswahl", async ({ page }) => {
    const mon = new AdminMonitoringPage(page)
    await mon.goto()
    await expect(mon.title).toBeVisible({ timeout: 10_000 })

    await mon.severityFilter.selectOption("critical")
    await expect(mon.severityFilter).toHaveValue("critical")
    await mon.severityFilter.selectOption("")
  })

  test("Category-Filter akzeptiert Auswahl", async ({ page }) => {
    const mon = new AdminMonitoringPage(page)
    await mon.goto()
    await expect(mon.title).toBeVisible({ timeout: 10_000 })

    await mon.categoryFilter.selectOption("api")
    await expect(mon.categoryFilter).toHaveValue("api")
    await mon.categoryFilter.selectOption("")
  })

  test("'Fehler zurücksetzen' Button ist klickbar", async ({ page }) => {
    const mon = new AdminMonitoringPage(page)
    await mon.goto()
    await expect(mon.title).toBeVisible({ timeout: 10_000 })

    // Reset des in-Memory Stores — keine Backend-Mutation, sicher klickbar
    await mon.clearButton.click()
    // Nach Reset bleibt die Seite ohne Fehler — Heading bleibt sichtbar
    await expect(mon.title).toBeVisible()
  })
})

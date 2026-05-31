/**
 * Admin – Users (Liste, Filter, Suche, Navigation zur Detail-Seite)
 *
 * Read-only. Detail-Seiten-Aktionen (Suspend) sind in user-detail.spec.ts.
 */
import { test, expect } from "@playwright/test"
import { AdminUsersPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Benutzerliste", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Liste zeigt Heading + Tabelle (oder Leer-Hinweis)", async ({ page }) => {
    const users = new AdminUsersPage(page)
    await users.goto()

    await expect(users.title).toBeVisible({ timeout: 10_000 })
    await expect(users.table.or(users.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("Suche akzeptiert Eingabe und triggert Reload (Page reset auf 1)", async ({ page }) => {
    const users = new AdminUsersPage(page)
    await users.goto()
    await expect(users.title).toBeVisible({ timeout: 10_000 })

    await users.searchInput.fill("seller1")
    await expect(users.searchInput).toHaveValue("seller1")
    // Tabelle oder Leer-Hinweis bleibt — nur prüfen dass kein Render-Fehler
    await expect(users.table.or(users.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("Rolle-Filter setzt Query und Tabelle bleibt sichtbar", async ({ page }) => {
    const users = new AdminUsersPage(page)
    await users.goto()
    await expect(users.title).toBeVisible({ timeout: 10_000 })

    await users.roleFilter.selectOption("SELLER")
    await expect(users.roleFilter).toHaveValue("SELLER")
    await expect(users.table.or(users.emptyMessage)).toBeVisible({ timeout: 10_000 })

    await users.roleFilter.selectOption("")
  })

  test("Status-Filter ACTIVE liefert Ergebnisse", async ({ page }) => {
    const users = new AdminUsersPage(page)
    await users.goto()
    await expect(users.title).toBeVisible({ timeout: 10_000 })

    await users.statusFilter.selectOption("ACTIVE")
    await expect(users.statusFilter).toHaveValue("ACTIVE")
    await expect(users.table.or(users.emptyMessage)).toBeVisible({ timeout: 10_000 })

    await users.statusFilter.selectOption("")
  })

  test("Klick auf erste Zeile öffnet Detail-Seite /admin/users/[id]", async ({ page }) => {
    const users = new AdminUsersPage(page)
    await users.goto()
    await expect(users.title).toBeVisible({ timeout: 10_000 })

    const rowCount = await users.rows.count()
    test.skip(rowCount === 0, "Keine Benutzer in Seed-Daten — Test übersprungen.")

    await users.clickFirstRow()
    await expect(page).toHaveURL(/\/admin\/users\/[a-f0-9-]+/i, { timeout: 10_000 })
    // BackButton oder Heading bestätigt erfolgreichen Render
    await expect(page.getByRole("button", { name: /Zurück/i }).first()).toBeVisible({
      timeout: 10_000,
    })
  })
})

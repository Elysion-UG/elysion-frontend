/**
 * Admin – User Detail
 *
 * Mutating: testet den Sperren↔Aktivieren Toggle idempotent.
 * Endzustand = Startzustand, damit Seed-Daten unverändert bleiben.
 *
 * Wir wählen einen Buyer-Test-User (NICHT den Admin-Account selbst),
 * damit wir uns nicht selbst aussperren.
 */
import { test, expect, type Page } from "@playwright/test"
import { AdminUsersPage, AdminUserDetailPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"
import { BUYER_WITH_CART } from "../fixtures/credentials"

// Kein Login mit diesem Account — nur die Ziel-Adresse für die User-Suche.
// Aus credentials.ts, damit sie der Secret-Konfiguration folgt (#144).
const TEST_USER_EMAIL = BUYER_WITH_CART.email

test.describe.configure({ mode: "serial" })

async function openUserDetailByEmail(page: Page, email: string): Promise<void> {
  const users = new AdminUsersPage(page)
  await users.goto()
  await expect(users.title).toBeVisible({ timeout: 10_000 })
  await users.searchInput.fill(email)
  await expect(users.rowByEmail(email).first()).toBeVisible({ timeout: 10_000 })
  await users.rowByEmail(email).first().click()
  await expect(page).toHaveURL(/\/admin\/users\/[a-f0-9-]+/i, { timeout: 10_000 })
}

test.describe("Admin – User Detail", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Detail-Seite rendert mit Header und Aktions-Buttons", async ({ page }) => {
    await openUserDetailByEmail(page, TEST_USER_EMAIL)
    const detail = new AdminUserDetailPage(page)

    await expect(detail.backButton).toBeVisible()
    // Entweder Sperren oder Aktivieren-Button ist sichtbar je nach Startzustand
    const suspendOrActivate = page.getByRole("button", { name: /^(Sperren|Aktivieren)$/ })
    await expect(suspendOrActivate.first()).toBeVisible({ timeout: 10_000 })
  })

  test("Back-Button kehrt zur User-Liste zurück", async ({ page }) => {
    await openUserDetailByEmail(page, TEST_USER_EMAIL)
    const detail = new AdminUserDetailPage(page)

    await detail.backButton.click()
    await expect(page).toHaveURL(/\/admin\/users(\?|$)/, { timeout: 10_000 })
  })

  test("Sperren↔Aktivieren Toggle ist idempotent (Endzustand = Startzustand)", async ({ page }) => {
    await openUserDetailByEmail(page, TEST_USER_EMAIL)
    const detail = new AdminUserDetailPage(page)

    // Startzustand ermitteln: welcher Button ist sichtbar?
    const suspendVisible = await detail.suspendButton.isVisible().catch(() => false)
    const activateVisible = await detail.activateButton.isVisible().catch(() => false)

    test.skip(
      !suspendVisible && !activateVisible,
      "Kein Toggle-Button sichtbar (z.B. DELETED-Status)"
    )

    if (suspendVisible) {
      // ACTIVE → SUSPENDED → ACTIVE
      await test.step("Sperren", async () => {
        await detail.suspendButton.click()
        await expect(detail.activateButton).toBeVisible({ timeout: 10_000 })
      })
      await test.step("Wieder aktivieren (Cleanup)", async () => {
        await detail.activateButton.click()
        await expect(detail.suspendButton).toBeVisible({ timeout: 10_000 })
      })
    } else {
      // SUSPENDED → ACTIVE → SUSPENDED
      await test.step("Aktivieren", async () => {
        await detail.activateButton.click()
        await expect(detail.suspendButton).toBeVisible({ timeout: 10_000 })
      })
      await test.step("Wieder sperren (Cleanup)", async () => {
        await detail.suspendButton.click()
        await expect(detail.activateButton).toBeVisible({ timeout: 10_000 })
      })
    }
  })
})

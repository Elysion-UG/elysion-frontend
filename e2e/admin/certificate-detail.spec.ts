/**
 * Admin – Certificate Detail
 *
 * Read-only Render + Reject-Modal Open/Cancel.
 * Verify-Button bei PENDING nur Sichtbarkeit prüfen (irreversibel).
 */
import { test, expect, type Page } from "@playwright/test"
import { AdminCertificatesPage, AdminCertificateDetailPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

async function openFirstCertDetail(
  page: Page,
  statusFilter: "PENDING" | "VERIFIED" | ""
): Promise<boolean> {
  const certs = new AdminCertificatesPage(page)
  await certs.goto()
  await expect(certs.title).toBeVisible({ timeout: 10_000 })

  if (statusFilter) {
    await certs.statusFilter.selectOption(statusFilter)
  }

  const rowCount = await certs.rows.count()
  if (rowCount === 0) return false

  await certs.rows.first().click()
  await expect(page).toHaveURL(/\/admin\/certificates\/[a-f0-9-]+/i, { timeout: 10_000 })
  return true
}

test.describe("Admin – Certificate Detail (Read-only)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Detail rendert mit Informations-Block und Header", async ({ page }) => {
    const opened = await openFirstCertDetail(page, "")
    test.skip(!opened, "Keine Zertifikate vorhanden.")

    const detail = new AdminCertificateDetailPage(page)
    await expect(detail.infoHeading).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Zeitangaben/i)).toBeVisible()
  })

  test("Back-Button kehrt zur Liste zurück", async ({ page }) => {
    const opened = await openFirstCertDetail(page, "")
    test.skip(!opened, "Keine Zertifikate vorhanden.")

    await new AdminCertificateDetailPage(page).backButton.click()
    await expect(page).toHaveURL(/\/admin\/certificates(\?|$)/, { timeout: 10_000 })
  })
})

test.describe("Admin – Certificate Detail (Actions bei PENDING)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Reject-Modal öffnen + abbrechen", async ({ page }) => {
    const opened = await openFirstCertDetail(page, "PENDING")
    test.skip(!opened, "Keine PENDING-Zertifikate vorhanden.")

    const detail = new AdminCertificateDetailPage(page)
    await expect(detail.rejectButton).toBeVisible({ timeout: 10_000 })

    await detail.rejectButton.click()
    await expect(detail.rejectModalTitle).toBeVisible({ timeout: 5_000 })
    await detail.rejectModalTextarea.fill("E2E-Test — wird abgebrochen")
    await detail.rejectModalCancel.click()
    await expect(detail.rejectModalTitle).not.toBeVisible({ timeout: 5_000 })
  })

  test("Verify-Button ist sichtbar (kein Klick)", async ({ page }) => {
    const opened = await openFirstCertDetail(page, "PENDING")
    test.skip(!opened, "Keine PENDING-Zertifikate vorhanden.")

    const detail = new AdminCertificateDetailPage(page)
    await expect(detail.verifyButton).toBeVisible({ timeout: 10_000 })
    await expect(detail.verifyButton).toBeEnabled()
  })
})

/**
 * Admin – Certificates Liste
 *
 * - Read-only: Filter, Refresh
 * - Reject-Modal öffnen + abbrechen (irreversibel im Backend, daher kein Confirm)
 * - Verify-Button nur auf Sichtbarkeit prüfen, nicht klicken
 *
 * Detail-Seite: certificate-detail.spec.ts.
 */
import { test, expect } from "@playwright/test"
import { AdminCertificatesPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Zertifikate Liste", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Heading und Tabelle laden", async ({ page }) => {
    const certs = new AdminCertificatesPage(page)
    await certs.goto()

    await expect(certs.title).toBeVisible({ timeout: 10_000 })
    await expect(certs.table.or(certs.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("Status-Filter VERIFIED reduziert Liste, Tabelle bleibt sichtbar", async ({ page }) => {
    const certs = new AdminCertificatesPage(page)
    await certs.goto()
    await expect(certs.title).toBeVisible({ timeout: 10_000 })

    await certs.statusFilter.selectOption("VERIFIED")
    await expect(certs.statusFilter).toHaveValue("VERIFIED")
    await expect(certs.table.or(certs.emptyMessage)).toBeVisible({ timeout: 10_000 })

    await certs.statusFilter.selectOption("")
  })

  test("Refresh-Button lädt Liste neu", async ({ page }) => {
    const certs = new AdminCertificatesPage(page)
    await certs.goto()
    await expect(certs.title).toBeVisible({ timeout: 10_000 })

    await certs.refreshButton.click()
    await expect(certs.table.or(certs.emptyMessage)).toBeVisible({ timeout: 10_000 })
  })

  test("Dokument-Link öffnet in neuem Tab", async ({ page }) => {
    const certs = new AdminCertificatesPage(page)
    await certs.goto()
    await expect(certs.title).toBeVisible({ timeout: 10_000 })

    const docLink = page.locator('a:has-text("Dokument")').first()
    const count = await docLink.count()
    test.skip(count === 0, "Kein Zertifikat mit Dokument-URL — Test übersprungen.")

    await expect(docLink).toHaveAttribute("target", "_blank")
    await expect(docLink).toHaveAttribute("rel", /noopener|noreferrer/)
  })

  test("Reject-Modal öffnet bei PENDING und kann abgebrochen werden", async ({ page }) => {
    const certs = new AdminCertificatesPage(page)
    await certs.goto()
    await expect(certs.title).toBeVisible({ timeout: 10_000 })

    await certs.statusFilter.selectOption("PENDING")
    await expect(certs.statusFilter).toHaveValue("PENDING")

    const rejectButton = page.getByRole("button", { name: "Ablehnen" }).first()
    const count = await rejectButton.count()
    test.skip(count === 0, "Keine PENDING-Zertifikate — Test übersprungen.")

    await rejectButton.click()
    await expect(certs.rejectModalTitle).toBeVisible({ timeout: 5_000 })
    await expect(certs.rejectModalTextarea).toBeVisible()

    // Eingabe testen
    await certs.rejectModalTextarea.fill("E2E-Test — wird abgebrochen")
    await expect(certs.rejectModalTextarea).toHaveValue("E2E-Test — wird abgebrochen")

    // Abbrechen (NICHT bestätigen!)
    await certs.rejectModalCancel.click()
    await expect(certs.rejectModalTitle).not.toBeVisible({ timeout: 5_000 })

    await certs.statusFilter.selectOption("")
  })

  test("Verify-Button bei PENDING ist sichtbar (kein Klick)", async ({ page }) => {
    const certs = new AdminCertificatesPage(page)
    await certs.goto()
    await expect(certs.title).toBeVisible({ timeout: 10_000 })

    await certs.statusFilter.selectOption("PENDING")
    const verifyButton = page.getByRole("button", { name: "Verifizieren" })
    const count = await verifyButton.count()
    test.skip(count === 0, "Keine PENDING-Zertifikate.")

    await expect(verifyButton.first()).toBeVisible()
    await expect(verifyButton.first()).toBeEnabled()

    await certs.statusFilter.selectOption("")
  })
})

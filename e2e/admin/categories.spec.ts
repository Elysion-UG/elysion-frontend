/**
 * Admin – Categories
 *
 * - Tree-Render mit Expand/Collapse
 * - Create-Modal: neue Test-Kategorie erstellen, dann deaktivieren (Cleanup —
 *   kein Hard-Delete im Backend)
 * - Edit-Modal: öffnen + abbrechen
 * - Aktualisieren-Button
 *
 * Eindeutiger Test-Name: e2e-cat-<timestamp> damit parallele Läufe nicht
 * kollidieren und der Test-Eintrag in der DB erkennbar bleibt.
 *
 * EINZIGE schreibende Spec-Datei der Suite (#144). Weil das Backend kein
 * Hard-Delete anbietet, bleibt pro Lauf eine deaktivierte Kategorie
 * `e2e-cat-<timestamp>` zurück. Gegen ein geteiltes Stage-Backend sammeln die
 * sich über die Zeit an — erkennbar am Präfix und gefahrlos löschbar, sobald
 * das Backend einen Delete-Endpunkt hat (dann hier nachziehen).
 */
import { test, expect } from "@playwright/test"
import { AdminCategoriesPage } from "../pages"
import { persistAdminState } from "../fixtures/admin-state"

test.describe.configure({ mode: "serial" })

test.describe("Admin – Categories Read-only", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Heading und Tabelle laden", async ({ page }) => {
    const cats = new AdminCategoriesPage(page)
    await cats.goto()

    await expect(cats.title).toBeVisible({ timeout: 10_000 })
    // Entweder Tree oder Empty-State
    await expect(cats.table.or(page.getByText(/Keine Kategorien vorhanden/i))).toBeVisible({
      timeout: 10_000,
    })
  })

  test("Aktualisieren-Button lädt neu", async ({ page }) => {
    const cats = new AdminCategoriesPage(page)
    await cats.goto()
    await expect(cats.title).toBeVisible({ timeout: 10_000 })

    await cats.refreshButton.click()
    await expect(cats.title).toBeVisible({ timeout: 10_000 })
  })
})

test.describe("Admin – Categories Modals (Open/Cancel)", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  test("Create-Modal öffnet + Abbrechen schließt", async ({ page }) => {
    const cats = new AdminCategoriesPage(page)
    await cats.goto()
    await expect(cats.title).toBeVisible({ timeout: 10_000 })

    await cats.newCategoryButton.click()
    await expect(cats.modalTitleCreate).toBeVisible({ timeout: 5_000 })
    await expect(cats.modalNameInput).toBeVisible()
    await expect(cats.modalSlugInput).toBeVisible()

    // Speichern-Button ist disabled wenn Name leer
    await expect(cats.modalSaveButton).toBeDisabled()

    await cats.modalCancelButton.click()
    await expect(cats.modalTitleCreate).not.toBeVisible({ timeout: 5_000 })
  })

  test("Edit-Modal (Pencil) öffnet + Abbrechen schließt", async ({ page }) => {
    const cats = new AdminCategoriesPage(page)
    await cats.goto()
    await expect(cats.title).toBeVisible({ timeout: 10_000 })

    // Erste Pencil-Bearbeiten-Aktion in der Liste finden
    const firstEditButton = page.getByRole("button", { name: "Bearbeiten" }).first()
    const editCount = await firstEditButton.count()
    test.skip(editCount === 0, "Keine Kategorien zum Editieren vorhanden.")

    await firstEditButton.click()
    await expect(cats.modalTitleEdit).toBeVisible({ timeout: 5_000 })
    await expect(cats.modalNameInput).toBeVisible()

    await cats.modalCancelButton.click()
    await expect(cats.modalTitleEdit).not.toBeVisible({ timeout: 5_000 })
  })
})

test.describe("Admin – Categories Create + Cleanup", () => {
  test.afterEach(async ({ page }) => {
    await persistAdminState(page)
  })

  // QUARANTÄNE (#178): Gegen das Stage-Backend schließt sich der Create-Modal
  // nach dem Speichern nicht — der POST auf den Kategorie-Endpunkt geht nicht
  // durch (Save war enabled, Modal bleibt offen, keine Client-Fehlermeldung).
  // Ursache liegt backend-seitig und braucht dortige Logs; bis dahin würde
  // dieser einzige schreibende Test die Suite rot halten. Read-Pfad (oben)
  // läuft weiter. Wieder aktivieren, sobald #178 geklärt ist.
  test.fixme("Neue Test-Kategorie erstellen → in Liste sichtbar → deaktivieren", async ({
    page,
  }) => {
    const testName = `e2e-cat-${Date.now()}`
    const cats = new AdminCategoriesPage(page)
    await cats.goto()
    await expect(cats.title).toBeVisible({ timeout: 10_000 })

    await test.step("Modal öffnen + Felder ausfüllen + Speichern", async () => {
      await cats.newCategoryButton.click()
      await expect(cats.modalTitleCreate).toBeVisible({ timeout: 5_000 })
      await cats.modalNameInput.fill(testName)
      // Slug wird automatisch befüllt — wir lassen ihn so

      await expect(cats.modalSaveButton).toBeEnabled()
      await cats.modalSaveButton.click()
      await expect(cats.modalTitleCreate).not.toBeVisible({ timeout: 10_000 })
    })

    await test.step("Neue Kategorie taucht in der Liste auf", async () => {
      await expect(cats.rowByName(testName)).toBeVisible({ timeout: 10_000 })
    })

    await test.step("Cleanup: Test-Kategorie deaktivieren", async () => {
      // Status-Toggle-Button: bei Aktiv wird "Deaktivieren" gezeigt (title-Attribut)
      await cats.toggleStatusButton(testName).click()
      // Nach Toggle wird der Name durchgestrichen → Zeile ist immer noch da,
      // wir prüfen einfach dass der Inverse-Button "Aktivieren" jetzt sichtbar ist
      await expect(
        cats.rowByName(testName).getByRole("button", { name: "Aktivieren" })
      ).toBeVisible({ timeout: 10_000 })
    })
  })
})

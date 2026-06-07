import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminCategoriesPage extends BasePage {
  readonly title: Locator
  readonly newCategoryButton: Locator
  readonly refreshButton: Locator
  readonly table: Locator

  // Modal locators (rendered conditionally)
  readonly modalTitleCreate: Locator
  readonly modalTitleEdit: Locator
  readonly modalNameInput: Locator
  readonly modalSlugInput: Locator
  readonly modalDescriptionInput: Locator
  readonly modalOrderInput: Locator
  readonly modalSaveButton: Locator
  readonly modalCancelButton: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Kategorie-Verwaltung", exact: true })
    this.newCategoryButton = page.getByRole("button", { name: /Neue Kategorie/i })
    this.refreshButton = page.getByRole("button", { name: /Aktualisieren/i })
    this.table = page.locator("table")

    this.modalTitleCreate = page.getByRole("heading", { name: "Neue Kategorie", exact: true })
    this.modalTitleEdit = page.getByRole("heading", { name: "Kategorie bearbeiten", exact: true })
    this.modalNameInput = page.getByPlaceholder("z.B. Bio-Textilien")
    this.modalSlugInput = page.getByPlaceholder("auto-generiert")
    this.modalDescriptionInput = page.getByPlaceholder("Optionale Beschreibung...")
    // Number input — order
    this.modalOrderInput = page.locator('input[type="number"]')
    this.modalSaveButton = page.getByRole("button", { name: "Speichern" })
    this.modalCancelButton = page.getByRole("button", { name: "Abbrechen" })
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/categories")
  }

  rowByName(name: string): Locator {
    return this.table.locator("tbody tr").filter({ hasText: name }).first()
  }

  /** Pencil-Button in einer Zeile öffnet das Edit-Modal. */
  editButton(name: string): Locator {
    return this.rowByName(name).getByRole("button", { name: "Bearbeiten" })
  }

  /** Toggle-Button (Aktivieren oder Deaktivieren) in einer Zeile. */
  toggleStatusButton(name: string): Locator {
    return this.rowByName(name).getByRole("button", { name: /(Aktivieren|Deaktivieren)/i })
  }
}

import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminProductsPage extends BasePage {
  readonly title: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly refreshButton: Locator
  readonly table: Locator
  readonly rows: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Produkt-Verwaltung", exact: true })
    this.searchInput = page.getByPlaceholder(/Produkt oder Verkäufer suchen/i)
    this.statusFilter = page.locator("select").filter({ hasText: "Alle Status" }).first()
    this.refreshButton = page.getByRole("button", { name: /Aktualisieren/i })
    this.table = page.locator("table")
    this.rows = this.table.locator("tbody tr")
    this.emptyMessage = page.getByText(/Keine Produkte gefunden/i)
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/products")
  }

  async clickFirstRow(): Promise<void> {
    await this.rows.first().click()
  }

  /** Row's inline Activate-/Deactivate-button (status-dependent). */
  rowToggleButton(rowIndex = 0): Locator {
    return this.rows.nth(rowIndex).getByRole("button", { name: /(Aktivieren|Deaktivieren)/i })
  }
}

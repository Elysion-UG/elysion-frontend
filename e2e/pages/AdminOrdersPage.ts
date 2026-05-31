import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminOrdersPage extends BasePage {
  readonly title: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly refreshButton: Locator
  readonly table: Locator
  readonly rows: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Bestellungs-Verwaltung", exact: true })
    this.searchInput = page.getByPlaceholder(/Bestellnummer oder E-Mail/i)
    this.statusFilter = page.locator("select").filter({ hasText: "Alle Status" }).first()
    this.refreshButton = page.getByRole("button", { name: /Aktualisieren/i })
    this.table = page.locator("table")
    this.rows = this.table.locator("tbody tr")
    this.emptyMessage = page.getByText(/Keine Bestellungen gefunden/i)
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/orders")
  }

  async clickFirstRow(): Promise<void> {
    await this.rows.first().click()
  }
}

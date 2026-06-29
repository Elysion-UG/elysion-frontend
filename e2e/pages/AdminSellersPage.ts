import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminSellersPage extends BasePage {
  readonly title: Locator
  readonly searchInput: Locator
  readonly table: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Verkäufer-Verwaltung", exact: true })
    this.searchInput = page.getByPlaceholder(/Suchen|Suche|Search/i)
    this.table = page.locator("table")
  }

  async goto() {
    await this.page.goto("/admin/sellers")
  }
}

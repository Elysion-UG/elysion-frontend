import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminUsersPage extends BasePage {
  readonly title: Locator
  readonly searchInput: Locator
  readonly roleFilter: Locator
  readonly statusFilter: Locator
  readonly table: Locator
  readonly rows: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Benutzerverwaltung", exact: true })
    this.searchInput = page.getByPlaceholder(/Name oder E-Mail suchen/i)
    // 2 selects: role + status (no labels, identify by option text)
    this.roleFilter = page.locator("select").filter({ hasText: "Alle Rollen" })
    this.statusFilter = page.locator("select").filter({ hasText: "Alle Status" })
    this.table = page.locator("table")
    this.rows = this.table.locator("tbody tr")
    this.emptyMessage = page.getByText(/Keine Benutzer gefunden/i)
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/users")
  }

  async clickFirstRow(): Promise<void> {
    await this.rows.first().click()
  }

  rowByEmail(email: string): Locator {
    return this.rows.filter({ hasText: email })
  }
}

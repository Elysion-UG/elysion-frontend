import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminMonitoringPage extends BasePage {
  readonly title: Locator
  readonly clearButton: Locator
  readonly severityFilter: Locator
  readonly categoryFilter: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Monitoring", exact: true })
    this.clearButton = page.getByRole("button", { name: /Fehler zurücksetzen/i })
    this.severityFilter = page.locator("select").filter({ hasText: "Alle Schweregrade" })
    this.categoryFilter = page.locator("select").filter({ hasText: "Alle Kategorien" })
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/monitoring")
  }

  /** Time-range buttons: "1 Std." / "6 Std." / "24 Std." */
  timeRangeButton(label: "1 Std." | "6 Std." | "24 Std."): Locator {
    return this.page.getByRole("button", { name: label, exact: true })
  }
}

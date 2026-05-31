import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminDashboardPage extends BasePage {
  readonly title: Locator
  readonly retryButton: Locator
  readonly quickLinksSection: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Dashboard", exact: true })
    this.retryButton = page.getByRole("button", { name: /Erneut versuchen/i })
    this.quickLinksSection = page.getByText("Schnellzugriff")
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin")
  }

  /** KPI-Karten haben eine spezielle Border + ring; wir matchen via "Benutzer" Titel. */
  kpiCard(title: string): Locator {
    return this.page
      .locator("div")
      .filter({ hasText: new RegExp(`^${title}$`) })
      .first()
  }

  quickLink(label: string): Locator {
    return this.page.getByRole("link", { name: label, exact: true })
  }
}

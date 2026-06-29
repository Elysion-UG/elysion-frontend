import { Page, expect } from "@playwright/test"
import { BasePage } from "./BasePage"

export class SellerDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await this.goto("/seller-dashboard")
    await this.expectHeading(/Produkte|Bestellungen|Profil/, { timeout: 15_000 })
  }

  tab(label: string) {
    return this.page.getByRole("tab", { name: label, exact: true })
  }

  async switchToTab(label: string) {
    await this.tab(label).click()
  }

  async expectProductsTable() {
    await expect(this.heading("Produkte", { exact: true })).toBeVisible({ timeout: 10_000 })
  }
}

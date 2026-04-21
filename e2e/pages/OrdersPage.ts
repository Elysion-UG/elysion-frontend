import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class OrdersPage extends BasePage {
  readonly title: Locator
  readonly emptyHeading: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Meine Bestellungen", exact: true })
    this.emptyHeading = page.getByRole("heading", {
      name: "Noch keine Bestellungen",
      exact: true,
    })
  }

  async goto() {
    await this.page.goto("/orders")
  }
}

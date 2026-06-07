import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class CartPage extends BasePage {
  readonly title: Locator
  readonly emptyHeading: Locator
  readonly checkoutLink: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Warenkorb", exact: true })
    this.emptyHeading = page.getByRole("heading", {
      name: "Dein Warenkorb ist leer",
      exact: true,
    })
    this.checkoutLink = page.getByRole("link", { name: /Zur Kasse/i })
  }

  async goto() {
    await this.page.goto("/cart")
  }
}

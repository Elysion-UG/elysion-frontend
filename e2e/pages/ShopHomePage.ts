import { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class ShopHomePage extends BasePage {
  readonly productCards: Locator

  constructor(page: Page) {
    super(page)
    this.productCards = page.getByTestId("product-card")
  }

  async open() {
    await this.goto("/")
  }

  /** Öffnet die erste Produktkarte des Shop-Grids (führt zur Produktdetail-Seite). */
  async openFirstProduct(): Promise<void> {
    const first = this.productCards.first()
    await first.waitFor({ state: "visible", timeout: 15_000 })
    await first.click()
    await this.waitForURLPattern(/\/product\?/)
  }

  footer() {
    return this.page.getByRole("contentinfo")
  }

  aboutLink() {
    return this.page.getByRole("link", { name: /über uns/i }).first()
  }

  async openAbout() {
    await this.aboutLink().click()
    await this.waitForURLPattern(/\/about$/)
  }
}

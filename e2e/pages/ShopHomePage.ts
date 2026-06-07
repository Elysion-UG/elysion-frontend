import { Page } from "@playwright/test"
import { BasePage } from "./BasePage"

export class ShopHomePage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await this.goto("/")
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

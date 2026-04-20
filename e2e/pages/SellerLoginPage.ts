import { Page } from "@playwright/test"
import { BasePage } from "./BasePage"

export class SellerLoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await this.goto("/login/seller")
    await this.expectHeading(/Anmelden|Login/i, { timeout: 10_000 })
  }

  async fillCredentials(email: string, password: string) {
    await this.page.getByPlaceholder("ihre@firma.de").fill(email)
    await this.page.getByPlaceholder("Passwort").fill(password)
  }

  async submit() {
    await this.page.getByRole("button", { name: "Anmelden" }).click()
  }

  async loginWith(email: string, password: string) {
    await this.fillCredentials(email, password)
    await this.submit()
    await this.waitForURLPattern(/\/seller-dashboard/)
  }
}

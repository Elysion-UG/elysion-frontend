import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class CheckoutPage extends BasePage {
  readonly addressHeading: Locator
  readonly loginRequiredHeading: Locator
  readonly continueToPreviewButton: Locator

  constructor(page: Page) {
    super(page)
    this.addressHeading = page.getByRole("heading", { name: /Lieferadresse/i })
    this.loginRequiredHeading = page.getByRole("heading", { name: /Anmeldung erforderlich/i })
    this.continueToPreviewButton = page.getByRole("button", { name: /Weiter zur Übersicht/i })
  }

  async goto() {
    await this.page.goto("/checkout")
  }
}

import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminOrderDetailPage extends BasePage {
  readonly backButton: Locator
  readonly costsHeading: Locator
  readonly shippingHeading: Locator
  readonly billingHeading: Locator
  readonly groupsHeading: Locator

  constructor(page: Page) {
    super(page)
    this.backButton = page.getByRole("button", { name: /Zurück/i }).first()
    this.costsHeading = page.getByRole("heading", { name: /Kosten/i })
    this.shippingHeading = page.getByText(/Lieferadresse/i)
    this.billingHeading = page.getByText(/Rechnungsadresse/i)
    this.groupsHeading = page.getByText(/Seller-Gruppen/i)
  }

  async goto(orderId: string): Promise<void> {
    await this.page.goto(`/admin/orders/${orderId}`)
  }
}

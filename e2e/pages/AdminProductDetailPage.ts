import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminProductDetailPage extends BasePage {
  readonly backButton: Locator
  readonly activateButton: Locator
  readonly deactivateButton: Locator
  readonly shopLink: Locator
  readonly sellerLink: Locator

  constructor(page: Page) {
    super(page)
    this.backButton = page.getByRole("button", { name: /Zurück/i }).first()
    this.activateButton = page.getByRole("button", { name: /^Aktivieren$/i })
    this.deactivateButton = page.getByRole("button", { name: /^Deaktivieren$/i })
    this.shopLink = page.getByRole("link", { name: /Im Shop ansehen/i })
    this.sellerLink = page.locator("dd a[href^='/admin/sellers/']").first()
  }

  async goto(productId: string): Promise<void> {
    await this.page.goto(`/admin/products/${productId}`)
  }
}

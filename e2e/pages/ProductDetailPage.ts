import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

/**
 * Produktdetail-Seite (`/product?slug=…`). Wird im Checkout-Happy-Path genutzt,
 * um den Warenkorb self-contained mit einem Artikel zu befüllen, bevor zur Kasse
 * navigiert wird (der `complete`-Step leert den Warenkorb).
 */
export class ProductDetailPage extends BasePage {
  readonly addToCartButton: Locator
  readonly addedConfirmation: Locator

  constructor(page: Page) {
    super(page)
    // Label wechselt: „In den Warenkorb“ → „Wird hinzugefügt…“ → „Hinzugefügt!“
    this.addToCartButton = page.getByRole("button", {
      name: /In den Warenkorb|Wird hinzugefügt|Hinzugefügt/i,
    })
    this.addedConfirmation = page.getByRole("button", { name: /Hinzugefügt/i })
  }

  /** Legt das aktuell angezeigte Produkt in den Warenkorb und wartet auf die Bestätigung. */
  async addToCart(): Promise<void> {
    await this.addToCartButton.click()
    await this.addedConfirmation.waitFor({ state: "visible", timeout: 8_000 })
  }
}

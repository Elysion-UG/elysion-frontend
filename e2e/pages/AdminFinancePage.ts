import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export type FinanceTab = "Zahlungen" | "Erstattungen" | "Abrechnungen" | "Auszahlungen" | "Wartung"

export class AdminFinancePage extends BasePage {
  readonly title: Locator
  readonly refreshButton: Locator
  readonly maintenanceHint: Locator
  readonly tokenCleanupButton: Locator
  readonly orderExpireButton: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: /Finanzen & Wartung/i })
    this.refreshButton = page.getByRole("button", { name: /Aktualisieren/i })
    this.maintenanceHint = page.getByText(/Wartungs-Jobs werden normalerweise automatisch/i)
    // Both maintenance buttons share label "Ausführen" — disambiguate by section
    this.tokenCleanupButton = page
      .locator("div", { hasText: "Refresh-Tokens bereinigen" })
      .getByRole("button", { name: "Ausführen" })
      .first()
    this.orderExpireButton = page
      .locator("div", { hasText: "Ausstehende Bestellungen ablaufen lassen" })
      .getByRole("button", { name: "Ausführen" })
      .first()
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/finance")
  }

  tab(name: FinanceTab): Locator {
    return this.page.getByRole("button", { name, exact: true })
  }

  async openTab(name: FinanceTab): Promise<void> {
    await this.tab(name).click()
  }
}

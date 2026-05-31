import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminUserDetailPage extends BasePage {
  readonly backButton: Locator
  readonly suspendButton: Locator
  readonly activateButton: Locator
  readonly approveSellerButton: Locator
  readonly rejectSellerButton: Locator

  constructor(page: Page) {
    super(page)
    this.backButton = page.getByRole("button", { name: /Zurück/i }).first()
    this.suspendButton = page.getByRole("button", { name: "Sperren", exact: true })
    this.activateButton = page.getByRole("button", { name: "Aktivieren", exact: true })
    this.approveSellerButton = page.getByRole("button", { name: /Verkäufer genehmigen/i })
    this.rejectSellerButton = page.getByRole("button", { name: /Verkäufer ablehnen/i })
  }

  async goto(userId: string): Promise<void> {
    await this.page.goto(`/admin/users/${userId}`)
  }

  /** Heading shows full name. Returns the locator for current visible heading. */
  heading(name: string | RegExp = /./, opts: { exact?: boolean } = {}): Locator {
    return this.page.getByRole("heading", { name, exact: opts.exact })
  }
}

import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminCertificatesPage extends BasePage {
  readonly title: Locator
  readonly statusFilter: Locator
  readonly refreshButton: Locator
  readonly table: Locator
  readonly rows: Locator
  readonly emptyMessage: Locator

  // Reject modal (shared)
  readonly rejectModalTitle: Locator
  readonly rejectModalTextarea: Locator
  readonly rejectModalCancel: Locator
  readonly rejectModalConfirm: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: "Zertifikat-Prüfung", exact: true })
    this.statusFilter = page.locator("select").filter({ hasText: "Alle Status" }).first()
    this.refreshButton = page.getByRole("button", { name: /Aktualisieren/i })
    this.table = page.locator("table")
    this.rows = this.table.locator("tbody tr")
    this.emptyMessage = page.getByText(/Keine Zertifikate gefunden/i)

    this.rejectModalTitle = page.getByRole("heading", { name: "Zertifikat ablehnen" })
    this.rejectModalTextarea = page.getByPlaceholder(/Ablehnungsgrund/i)
    this.rejectModalCancel = page.getByRole("button", { name: "Abbrechen" })
    this.rejectModalConfirm = page.getByRole("button", { name: "Ablehnen", exact: true })
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/certificates")
  }

  rowAt(index = 0): Locator {
    return this.rows.nth(index)
  }

  verifyButton(rowIndex = 0): Locator {
    return this.rowAt(rowIndex).getByRole("button", { name: "Verifizieren" })
  }

  rejectButton(rowIndex = 0): Locator {
    return this.rowAt(rowIndex).getByRole("button", { name: "Ablehnen" })
  }
}

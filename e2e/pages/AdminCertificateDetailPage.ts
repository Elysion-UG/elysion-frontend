import type { Page, Locator } from "@playwright/test"
import { BasePage } from "./BasePage"

export class AdminCertificateDetailPage extends BasePage {
  readonly backButton: Locator
  readonly verifyButton: Locator
  readonly rejectButton: Locator
  readonly documentLink: Locator
  readonly infoHeading: Locator

  readonly rejectModalTitle: Locator
  readonly rejectModalTextarea: Locator
  readonly rejectModalCancel: Locator
  readonly rejectModalConfirm: Locator

  constructor(page: Page) {
    super(page)
    this.backButton = page.getByRole("button", { name: /Zurück/i }).first()
    this.verifyButton = page.getByRole("button", { name: "Verifizieren" })
    this.rejectButton = page.getByRole("button", { name: "Ablehnen", exact: true }).first()
    this.documentLink = page.getByRole("link", { name: /Dokument öffnen/i })
    this.infoHeading = page.getByRole("heading", { name: /Zertifikat-Informationen/i })

    this.rejectModalTitle = page.getByRole("heading", { name: "Zertifikat ablehnen" })
    this.rejectModalTextarea = page.getByPlaceholder(/Ablehnungsgrund/i)
    this.rejectModalCancel = page.getByRole("button", { name: "Abbrechen" })
    this.rejectModalConfirm = page.locator('button:has-text("Ablehnen")').last()
  }

  async goto(certId: string): Promise<void> {
    await this.page.goto(`/admin/certificates/${certId}`)
  }
}

import { Locator, Page } from "@playwright/test"
import { BasePage } from "./BasePage"
import { clearCredentialFields, fillCredentialField } from "../fixtures/credential-fields"

export class SellerLoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  private get emailInput(): Locator {
    return this.page.getByPlaceholder("ihre@firma.de")
  }

  private get passwordInput(): Locator {
    return this.page.getByPlaceholder("Passwort")
  }

  async open() {
    await this.goto("/login/seller")
    await this.expectHeading(/Anmelden|Login/i, { timeout: 10_000 })
  }

  async fillCredentials(email: string, password: string) {
    // fillCredentialField statt fill(): hält den Wert aus dem Call-Log einer
    // fehlgeschlagenen Aktion heraus (#106) — siehe credential-fields.ts.
    await fillCredentialField(this.emailInput, email)
    await fillCredentialField(this.passwordInput, password)
  }

  async submit() {
    await this.page.getByRole("button", { name: "Anmelden" }).click()
  }

  /**
   * Füllen und Submit gehören zusammen in ein `try/finally`: Läuft der Klick in
   * einen Timeout, liefe ein nachgestelltes Leeren nie und das Passwort stünde
   * beim Teardown-Snapshot noch im Feld (#106). Wer `fillCredentials()` und
   * `submit()` einzeln aufruft, muss selbst dafür sorgen.
   */
  async loginWith(email: string, password: string) {
    try {
      await this.fillCredentials(email, password)
      await this.submit()
    } finally {
      await clearCredentialFields(this.passwordInput, this.emailInput)
    }
    await this.waitForURLPattern(/\/seller-dashboard/)
  }
}

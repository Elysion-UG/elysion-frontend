import type { Page, Locator } from "@playwright/test"

/**
 * Sidebar-Navigation des Admin-Portals. 9 Nav-Items + Logout im Footer.
 * Auf Desktop sichtbar als <aside>, auf Mobile via Menü-Button.
 */
export class AdminSidebarPanel {
  readonly page: Page
  readonly mobileMenuButton: Locator
  readonly mobileCloseButton: Locator
  readonly logoutButton: Locator

  constructor(page: Page) {
    this.page = page
    this.mobileMenuButton = page.getByRole("button", { name: "Menü öffnen" })
    this.mobileCloseButton = page.getByRole("button", { name: "Schließen" })
    this.logoutButton = page.getByRole("button", { name: "Abmelden" })
  }

  /** Holt einen Navigations-Link per sichtbarem Label (z.B. "Benutzer"). */
  navLink(label: string): Locator {
    return this.page.getByRole("link", { name: label, exact: true })
  }

  /** Aktiver Nav-Eintrag: hat den 1.5x1.5 pulsierenden Punkt rechts (rounded-full bg-cyber-400). */
  async clickNav(label: string): Promise<void> {
    await this.navLink(label).first().click()
  }
}

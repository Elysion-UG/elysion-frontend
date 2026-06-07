import { Page, Locator, expect } from "@playwright/test"

export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path)
  }

  heading(name: string | RegExp, opts?: { exact?: boolean }): Locator {
    return this.page.getByRole("heading", { name, exact: opts?.exact })
  }

  async expectHeading(name: string | RegExp, opts?: { exact?: boolean; timeout?: number }) {
    await expect(this.heading(name, { exact: opts?.exact })).toBeVisible({
      timeout: opts?.timeout ?? 10_000,
    })
  }

  async waitForURLPattern(pattern: RegExp | string, timeout = 10_000) {
    await this.page.waitForURL(pattern, { timeout })
  }
}

import { test as base, Page } from "@playwright/test"

// Shared test data — use test accounts that exist on staging
export const TEST_USERS = {
  buyer: {
    email: process.env.E2E_BUYER_EMAIL || "",
    password: process.env.E2E_BUYER_PASSWORD || "",
  },
  seller: {
    email: process.env.E2E_SELLER_EMAIL || "",
    password: process.env.E2E_SELLER_PASSWORD || "",
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || "",
    password: process.env.E2E_ADMIN_PASSWORD || "",
  },
}

// Helper: Login as buyer
export async function loginAsBuyer(page: Page) {
  await page.goto("/login")
  await page.getByLabel(/e-mail/i).fill(TEST_USERS.buyer.email)
  await page.getByLabel(/passwort/i).fill(TEST_USERS.buyer.password)
  await page.getByRole("button", { name: /anmelden/i }).click()
  await page.waitForURL(/\/(shop|dashboard|onboarding)/)
}

// Helper: Login as seller
export async function loginAsSeller(page: Page) {
  await page.goto("/login/seller")
  await page.getByPlaceholder("ihre@firma.de").fill(TEST_USERS.seller.email)
  await page.getByPlaceholder("Passwort").fill(TEST_USERS.seller.password)
  await page.getByRole("button", { name: "Anmelden" }).click()
  await page.waitForURL("**/seller-dashboard**", { timeout: 10_000 })
}

export const test = base
export { expect } from "@playwright/test"

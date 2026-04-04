import { defineConfig, devices } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SELLER_AUTH_FILE = path.join(__dirname, "e2e/.auth/seller.json")

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // ── Setup: einmaliger Login, speichert Auth-State ──────────────────────────
    {
      name: "seller-setup",
      testMatch: "**/auth.setup.ts",
    },

    // ── Seller-Tests: laufen nach Setup, nutzen gespeicherten Auth-State ───────
    {
      name: "seller",
      testMatch: "**/seller/**/*.spec.ts",
      dependencies: ["seller-setup"],
      use: {
        baseURL: "http://seller.localhost:3000",
        storageState: SELLER_AUTH_FILE,
      },
    },

    // ── Andere Tests (ohne Auth-Abhängigkeit) ──────────────────────────────────
    {
      name: "chromium",
      testIgnore: ["**/seller/**", "**/auth.setup.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})

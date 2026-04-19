import { defineConfig, devices } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SELLER_AUTH_FILE = path.join(__dirname, "e2e/.auth/seller.json")

export default defineConfig({
  testDir: "./e2e",
  // Tests laufen seriell (1 Worker): der HttpOnly Refresh-Token aus storageState
  // ist single-use — würden parallele Worker denselben Cookie laden, würde der
  // erste rotieren und die anderen mit 401 scheitern.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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

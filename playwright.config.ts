import { defineConfig, devices } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

import { traceMode } from "./e2e/trace-policy"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SELLER_AUTH_FILE = path.join(__dirname, "e2e/.auth/seller.json")
const BUYER_AUTH_FILE = path.join(__dirname, "e2e/.auth/buyer.json")
const ADMIN_AUTH_FILE = path.join(__dirname, "e2e/.auth/admin.json")

// Portal-Domains. Die App läuft lokal (auch in CI, siehe webServer unten) und
// spricht das entfernte Backend über den Auth-Proxy an — die Portale sind
// deshalb immer localhost-Varianten.
const BUYER_URL = process.env.BASE_URL || "http://localhost:3000"
const SELLER_URL = process.env.SELLER_BASE_URL || "http://seller.localhost:3000"
const ADMIN_URL = process.env.ADMIN_BASE_URL || "http://admin.localhost:3000"

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

  // Startet die App selbst, statt sie im Workflow mit `bun run start &` in den
  // Hintergrund zu schicken — der Prozess überlebte den Step-Wechsel nicht und
  // ließ wait-on in den Timeout laufen (#144). Playwright hält den Server über
  // den gesamten Lauf und räumt am Ende auf.
  //
  // Abschaltbar über E2E_SKIP_WEBSERVER: das stage-smoke-Projekt läuft gegen
  // die deployten Stage-Domains und baut die App nie — ohne diesen Schalter
  // würde `bun run start` dort ohne .next-Build in den Timeout laufen.
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: "bun run start",
        url: BUYER_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },

  use: {
    baseURL: BUYER_URL,
    // In CI aus, weil der Trace den Login-Body im Klartext enthält (#106).
    // Begründung und Messung: e2e/trace-policy.ts
    trace: traceMode(),
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // ── Setup-Projekte: einmaliger Login je Portal, speichert Auth-State ───────
    // Die baseURL muss hier stehen: die Setups navigieren relativ, und ein
    // Setup ohne eigene baseURL landete sonst auf dem Buyer-Portal (#144).
    {
      name: "seller-setup",
      testMatch: "**/auth.setup.ts",
      use: { baseURL: SELLER_URL },
    },
    {
      name: "buyer-setup",
      testMatch: "**/buyer.setup.ts",
      use: { baseURL: BUYER_URL },
    },
    {
      name: "admin-setup",
      testMatch: "**/admin.setup.ts",
      use: { baseURL: ADMIN_URL },
    },

    // ── Seller-Tests: nach Setup, nutzen gespeicherten Auth-State ──────────────
    {
      name: "seller",
      testMatch: "**/seller/**/*.spec.ts",
      dependencies: ["seller-setup"],
      use: {
        baseURL: SELLER_URL,
        storageState: SELLER_AUTH_FILE,
      },
    },

    // ── Buyer-Tests (Shop-Domain, eingeloggt) ──────────────────────────────────
    {
      name: "buyer",
      testMatch: "**/buyer/**/*.spec.ts",
      dependencies: ["buyer-setup"],
      use: {
        baseURL: BUYER_URL,
        storageState: BUYER_AUTH_FILE,
      },
    },

    // ── Admin-Tests (Admin-Domain, eingeloggt) ─────────────────────────────────
    {
      name: "admin",
      testMatch: "**/admin/**/*.spec.ts",
      dependencies: ["admin-setup"],
      use: {
        baseURL: ADMIN_URL,
        storageState: ADMIN_AUTH_FILE,
      },
    },

    // ── Stage-Smoke: läuft gegen die Staging-Deployments (FE#24) ──────────────
    // Kein storageState/Setup — der Spec loggt sich selbst ein (max. 2 Logins,
    // Retries auf 1 begrenzt wegen Backend-Rate-Limit 5 Logins/15 min pro IP).
    {
      name: "stage-smoke",
      testMatch: "**/stage/**/*.spec.ts",
      retries: process.env.CI ? 1 : 0,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Öffentliche Tests (ohne Auth-Abhängigkeit) ─────────────────────────────
    {
      name: "chromium",
      testIgnore: [
        "**/seller/**",
        "**/buyer/**",
        "**/admin/**",
        "**/auth.setup.ts",
        "**/buyer.setup.ts",
        "**/admin.setup.ts",
      ],
      testMatch: ["**/shop/**/*.spec.ts", "**/public/**/*.spec.ts", "**/auth/**/*.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})

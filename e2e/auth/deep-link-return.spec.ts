/**
 * Return-URL nach Login (#121) — End-to-End.
 *
 * Ein unauthentifizierter Deep-Link auf eine geschützte Buyer-Route wird von der
 * Middleware (#68) auf die Startseite umgeleitet, trägt das Ziel aber als
 * ?redirect= mit. PageLayout öffnet daraufhin automatisch das Login-Modal und
 * schickt den Nutzer nach erfolgreichem Login zurück auf genau diese Route.
 *
 * Läuft im `chromium`-Projekt OHNE storageState (unauthentifiziert) und führt
 * genau einen echten Login durch (Rate-Limit: 5 Versuche / 15 min pro IP+Mail).
 *
 * SECURITY (FE#65): Lokaler Seed-Account — nur gegen ein lokales Backend gültig,
 * auf Staging rotiert, in Produktion niemals vorhanden.
 */
import { test, expect } from "@playwright/test"
import { clearCredentialFields, fillCredentialField } from "../fixtures/credential-fields"
import { BUYER as CREDS } from "../fixtures/credentials"

const BUYER = "http://localhost:3000"

test("Deep-Link → Login → Ziel: /orders bleibt nach dem Login erhalten", async ({ page }) => {
  // 1. Deep-Link auf geschützte Route → Middleware bounct auf / mit ?redirect=.
  await page.goto(`${BUYER}/orders`)
  await expect(page).toHaveURL(
    (url) => url.pathname === "/" && url.searchParams.get("redirect") === "/orders",
    { timeout: 10_000 }
  )

  // 2. Das Login-Modal öffnet sich automatisch (kein Klick auf "Anmelden").
  await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible({
    timeout: 10_000,
  })

  // 3. Login durchführen.
  const emailInput = page.getByPlaceholder("ihre@email.de")
  const passwordInput = page.getByPlaceholder("Passwort")
  // Siehe e2e/fixtures/credential-fields.ts — Felder im `finally` leeren, damit
  // auch ein Timeout im Klick sie nicht im Snapshot stehen lässt (#106).
  try {
    await fillCredentialField(emailInput, CREDS.email)
    await fillCredentialField(passwordInput, CREDS.password)
    await page.getByRole("button", { name: "Anmelden" }).last().click()
  } finally {
    await clearCredentialFields(passwordInput, emailInput)
  }

  // 4. Nach erfolgreichem Login landet der Nutzer wieder auf /orders.
  await expect(page).toHaveURL(`${BUYER}/orders`, { timeout: 15_000 })
})

test("Ohne redirect-Param öffnet sich kein Login-Modal automatisch", async ({ page }) => {
  await page.goto(`${BUYER}/`)
  await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeHidden()
})

test("Open-Redirect: ein fremder Host im redirect-Param öffnet kein Auto-Login", async ({
  page,
}) => {
  // Der Sanitizer verwirft absolute Ziele → PageLayout behandelt den Param als
  // leer und öffnet das Modal NICHT automatisch. Der Nutzer kann so nie
  // unbemerkt auf einen fremden Host geschickt werden.
  await page.goto(`${BUYER}/?redirect=https://evil.example.com`)
  await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeHidden()
})

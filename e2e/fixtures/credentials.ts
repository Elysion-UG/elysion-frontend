/**
 * Zentrale Quelle für die E2E-Seed-Accounts (#144).
 *
 * Vorher lagen die Zugangsdaten an sechs Stellen hartcodiert (Setups +
 * auth-Specs) — mit den **lokalen** Seed-Passwörtern aus `docs/seed-data.sql`.
 * Gegen Staging sind die Passwörter rotiert (FE#65) und existieren nur als
 * GitHub-Secrets, weshalb dort jeder Login scheiterte und dabei zusätzlich
 * Rate-Limit-Budget verbrannte.
 *
 * Auflösung pro Account: Secret, sonst lokaler Seed-Default. Damit läuft die
 * Suite lokal ohne Konfiguration weiter und in CI gegen die rotierten Accounts.
 *
 * SECURITY (FE#65): Die Defaults hier sind ausschließlich die lokalen
 * Seed-Passwörter. In Produktion dürfen diese Accounts niemals existieren.
 */

export type Credentials = { email: string; password: string }

function account(emailVar: string, passwordVar: string, seed: Credentials): Credentials {
  return {
    email: process.env[emailVar] || seed.email,
    password: process.env[passwordVar] || seed.password,
  }
}

/** Seller-Portal. Seed: `seller1@greenthread.dev`. */
export const SELLER = account("E2E_SELLER_EMAIL", "E2E_SELLER_PASSWORD", {
  email: "seller1@greenthread.dev",
  password: "Seller123!",
})

/** Admin-Portal. Seed: `admin@marketplace.dev`. */
export const ADMIN = account("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD", {
  email: "admin@marketplace.dev",
  password: "Admin123!",
})

/**
 * Buyer für die Login-Flow-Specs (`e2e/auth/**`). Bewusst NICHT derselbe
 * Account wie {@link BUYER_WITH_CART}: diese Specs testen auch fehlschlagende
 * Logins und würden sonst das Rate-Limit des Checkout-Accounts aufbrauchen.
 */
export const BUYER = account("E2E_BUYER_EMAIL", "E2E_BUYER_PASSWORD", {
  email: "buyer1@example.dev",
  password: "Buyer123!",
})

/**
 * Buyer mit aktivem Warenkorb und hinterlegter Adresse — Voraussetzung für
 * `e2e/buyer/checkout.spec.ts` und `e2e/buyer/payment.spec.ts`.
 *
 * ACHTUNG: Für diesen Account existiert derzeit **kein** GitHub-Secret. Gegen
 * Staging greift daher der lokale Seed-Default, der dort rotiert wurde → die
 * Buyer-Tests scheitern, bis `E2E_BUYER2_EMAIL`/`E2E_BUYER2_PASSWORD` gesetzt
 * sind (Rotation: `scripts/rotate-stage-passwords.py` im Backend-Repo).
 */
export const BUYER_WITH_CART = account("E2E_BUYER2_EMAIL", "E2E_BUYER2_PASSWORD", {
  email: "buyer2@example.dev",
  password: "Buyer123!",
})

/**
 * True, wenn die Suite gegen ein entferntes Backend läuft (CI/Stage) und die
 * Credentials aus Secrets kommen müssen. Specs nutzen das für `test.skip`,
 * damit ein fehlendes Secret als übersprungen und nicht als Fehlschlag endet.
 */
export function hasRotatedSecret(passwordVar: string): boolean {
  return Boolean(process.env[passwordVar])
}

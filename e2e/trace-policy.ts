/**
 * Wann Playwright einen Trace aufzeichnen darf (#106).
 *
 * Eigenes Modul, damit die Regel testbar ist: playwright.config.ts laesst sich
 * im Unit-Test nicht laden (zieht @playwright/test mit), diese Datei schon.
 */

export type TraceMode = "off" | "on-first-retry"

/**
 * In CI niemals tracen.
 *
 * Der Trace zeichnet Netzwerk-Request-Bodies auf, und der Login-Body enthaelt
 * das Seed-Passwort im Klartext. CI laedt die Reports als Artefakt hoch und das
 * Repo ist oeffentlich — ein fehlgeschlagener Login-Test publiziert damit das
 * Passwort. Nachgemessen an Stage-Smoke-Lauf 50: Screenshot, Video und
 * error-context.md waren sauber, ausschliesslich der Trace war betroffen.
 *
 * Lokal bleibt der Trace an — dort wird nichts hochgeladen. Ein CI-Fehlschlag
 * ist per `npx playwright test --trace on` lokal nachstellbar; das ist der
 * bewusste Preis dafuer, keine Credentials zu veroeffentlichen.
 */
export function traceMode(env: Record<string, string | undefined> = process.env): TraceMode {
  return env.CI ? "off" : "on-first-retry"
}

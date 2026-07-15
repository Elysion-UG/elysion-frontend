import { describe, it, expect } from "vitest"

import { traceMode } from "@/e2e/trace-policy"

/**
 * Regression für #106.
 *
 * Der Playwright-Trace zeichnet Netzwerk-Request-Bodies auf — der Login-Body
 * enthält das Seed-Passwort im Klartext. CI lädt die Reports als Artefakt hoch,
 * das Repo ist öffentlich: Jeder fehlgeschlagene Login-Test hat das Passwort
 * damit publiziert. Der vorherige Fix (Formularfelder nach dem Submit leeren)
 * deckte nur den ARIA-Snapshot ab und liess den Trace unberührt, weshalb das
 * Leak über Wochen unbemerkt blieb.
 *
 * Der Test liegt hier statt bei playwright.config.ts, weil sich diese Config im
 * Unit-Test nicht laden lässt (zieht @playwright/test mit und hängt).
 */
describe("Playwright-Trace-Policy (#106)", () => {
  it("zeichnet in CI keinen Trace auf — dort werden Artefakte veröffentlicht", () => {
    expect(traceMode({ CI: "true" })).toBe("off")
  })

  it("zeichnet auch bei GitHub-Actions-typischem CI=1 keinen Trace auf", () => {
    expect(traceMode({ CI: "1" })).toBe("off")
  })

  it("behält den Trace lokal — dort wird nichts hochgeladen", () => {
    expect(traceMode({})).toBe("on-first-retry")
  })
})

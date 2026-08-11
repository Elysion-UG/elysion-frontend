import { describe, it, expect, vi } from "vitest"

vi.mock("@/src/components/features/products/ProducerPage", () => ({ default: () => null }))

import * as page from "./page"

/**
 * Drift-Guard für das Static Rendering von `/producer` (#37) — Begründung
 * siehe `(public)/product/page.test.ts`.
 */
describe("producer page — statische Metadaten", () => {
  it("exportiert kein generateMetadata (würde die Route dynamisch machen)", () => {
    expect("generateMetadata" in page).toBe(false)
  })

  it("setzt keine Route-Segment-Option, die das Prerendering abschaltet", () => {
    expect("dynamic" in page).toBe(false)
    expect("revalidate" in page).toBe(false)
  })

  it("liefert denselben generischen Titel wie bisher der Fehlerzweig", () => {
    expect(page.metadata).toEqual({ title: "Produzent" })
  })
})

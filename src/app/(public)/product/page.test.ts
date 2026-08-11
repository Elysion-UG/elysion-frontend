import { describe, it, expect, vi } from "vitest"

vi.mock("@/src/components/features/products/ProductDetail", () => ({ default: () => null }))

import * as page from "./page"

/**
 * Drift-Guard für das Static Rendering von `/product` (#37).
 *
 * Ein `generateMetadata({ searchParams })` auf dieser Route nimmt ihr das
 * Static Rendering (`○` → `ƒ`) — und zwar unabhängig davon, ob die Metadaten
 * überhaupt ankommen. Genau das war der Zustand bis #37: der Fetch scheiterte
 * server-seitig an der relativen API-Base und lieferte immer den generischen
 * Titel, bezahlt wurde trotzdem ein Per-Request-Render.
 *
 * Der Fehler ist im Build-Output sichtbar, aber leicht zu übersehen. Dieser
 * Test macht ihn zum Testfehler. Er ist keine Absage an produktspezifische
 * Metadaten — die brauchen pfadbasierte URLs (`/product/[slug]`) und eine
 * server-taugliche API-Base (#245); dann verschwindet dieser Guard mit der
 * Route.
 */
describe("product page — statische Metadaten", () => {
  it("exportiert kein generateMetadata (würde die Route dynamisch machen)", () => {
    expect("generateMetadata" in page).toBe(false)
  })

  it("setzt keine Route-Segment-Option, die das Prerendering abschaltet", () => {
    expect("dynamic" in page).toBe(false)
    expect("revalidate" in page).toBe(false)
  })

  it("liefert denselben generischen Titel wie bisher der Fehlerzweig", () => {
    expect(page.metadata).toEqual({ title: "Produkt" })
  })
})

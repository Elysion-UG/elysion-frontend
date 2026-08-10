import { describe, it, expect } from "vitest"
import { canSellerTransition, sellerProductTransitions } from "./seller-product-transitions"

describe("sellerProductTransitions", () => {
  it("offers DRAFT → REVIEW — der Weg aus dem Entwurf heraus", () => {
    expect(sellerProductTransitions("DRAFT")).toEqual([
      { target: "REVIEW", label: "Zur Prüfung einreichen" },
    ])
  })

  it("offers ACTIVE → INACTIVE and INACTIVE → ACTIVE", () => {
    expect(sellerProductTransitions("ACTIVE").map((t) => t.target)).toEqual(["INACTIVE"])
    expect(sellerProductTransitions("INACTIVE").map((t) => t.target)).toEqual(["ACTIVE"])
  })

  it("offers nothing in REVIEW — Freigabe und Ablehnung liegen nicht beim Verkäufer", () => {
    expect(sellerProductTransitions("REVIEW")).toEqual([])
    expect(canSellerTransition("REVIEW", "ACTIVE")).toBe(false)
    expect(canSellerTransition("REVIEW", "REJECTED")).toBe(false)
  })

  it("offers nothing in REJECTED — das Backend kennt keinen Übergang heraus", () => {
    expect(sellerProductTransitions("REJECTED")).toEqual([])
  })

  it("never offers a transition the backend rejects", () => {
    expect(canSellerTransition("DRAFT", "ACTIVE")).toBe(false)
    expect(canSellerTransition("DRAFT", "INACTIVE")).toBe(false)
    expect(canSellerTransition("INACTIVE", "REVIEW")).toBe(false)
    expect(canSellerTransition("ACTIVE", "DRAFT")).toBe(false)
  })

  it("falls back to no action for unknown or missing status", () => {
    expect(sellerProductTransitions(undefined)).toEqual([])
    expect(sellerProductTransitions(null)).toEqual([])
    expect(sellerProductTransitions("")).toEqual([])
    expect(sellerProductTransitions("ARCHIVED")).toEqual([])
    // Kein Prototyp-Durchgriff: "toString" ist `in {}`, aber kein Status.
    expect(sellerProductTransitions("toString")).toEqual([])
  })
})

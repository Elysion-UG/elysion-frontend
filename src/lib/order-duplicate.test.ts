import { describe, expect, it } from "vitest"
import {
  DUPLICATE_NOTE_MAX_LENGTH,
  canDecideDuplicate,
  duplicateBuyerLabel,
  duplicateConfidence,
  formatSecondsApart,
  isDuplicateDecided,
  orderRefLabel,
  shortMatchSignature,
  validateDuplicateDecision,
} from "./order-duplicate"
import type { OrderDuplicateFlag, OrderDuplicateOrderRef } from "@/src/types"

const orderRef = (overrides: Partial<OrderDuplicateOrderRef> = {}): OrderDuplicateOrderRef => ({
  id: "11111111-2222-3333-4444-555555555555",
  orderNumber: "ORD-1001",
  userId: null,
  guestEmail: "kundin@example.com",
  status: "CONFIRMED",
  paymentStatus: "SUCCEEDED",
  total: 129.9,
  currency: "EUR",
  ...overrides,
})

const flag = (overrides: Partial<OrderDuplicateFlag> = {}): OrderDuplicateFlag => ({
  id: "flag-1",
  status: "OPEN",
  matchSignature: "a".repeat(64),
  secondsApart: 45,
  detectedAt: "2026-03-23T04:15:00Z",
  resolution: null,
  resolutionNote: null,
  resolvedBy: null,
  resolvedAt: null,
  order: orderRef({ orderNumber: "ORD-1002" }),
  duplicateOf: orderRef(),
  ...overrides,
})

describe("isDuplicateDecided / canDecideDuplicate", () => {
  it("liest ein offenes Flag als unentschieden", () => {
    expect(isDuplicateDecided(flag())).toBe(false)
    expect(canDecideDuplicate(flag())).toBe(true)
  })

  it("liest ein entschiedenes Flag als entschieden", () => {
    const decided = flag({
      status: "RESOLVED",
      resolution: "RELEASED",
      resolvedAt: "2026-03-23T09:00:00Z",
      resolvedBy: "admin-1",
      resolutionNote: "Kundin bestätigt",
    })
    expect(isDuplicateDecided(decided)).toBe(true)
    expect(canDecideDuplicate(decided)).toBe(false)
  })

  // Die beiden Fallen aus dem Backend-Vertrag: `resolutionNote` ist optional und
  // `resolvedBy` fällt bei gelöschtem Admin-Konto auf null zurück. Wer daran
  // „offen" festmacht, bietet den Fall ein zweites Mal zur Entscheidung an.
  it("bleibt entschieden ohne Begründung", () => {
    const decided = flag({
      status: "RESOLVED",
      resolution: "CANCELLED_REFUNDED",
      resolvedAt: "2026-03-23T09:00:00Z",
      resolvedBy: "admin-1",
      resolutionNote: null,
    })
    expect(isDuplicateDecided(decided)).toBe(true)
  })

  it("bleibt entschieden, wenn der entscheidende Admin gelöscht wurde", () => {
    const decided = flag({
      status: "RESOLVED",
      resolution: "RELEASED",
      resolvedAt: "2026-03-23T09:00:00Z",
      resolvedBy: null,
      resolutionNote: "Echtbestellung",
    })
    expect(isDuplicateDecided(decided)).toBe(true)
    expect(canDecideDuplicate(decided)).toBe(false)
  })
})

describe("validateDuplicateDecision", () => {
  it("weist eine fehlende Entscheidung ab", () => {
    const result = validateDuplicateDecision({ resolution: null, note: "" })
    expect(result).toEqual({ valid: false, error: "Bitte eine Entscheidung auswählen." })
  })

  it("lässt die Notiz weg, wenn sie leer oder nur Whitespace ist", () => {
    expect(validateDuplicateDecision({ resolution: "RELEASED", note: "   " })).toEqual({
      valid: true,
      payload: { resolution: "RELEASED" },
    })
  })

  it("trimmt eine vorhandene Notiz", () => {
    expect(
      validateDuplicateDecision({ resolution: "CANCELLED_REFUNDED", note: "  Versehen  " })
    ).toEqual({
      valid: true,
      payload: { resolution: "CANCELLED_REFUNDED", note: "Versehen" },
    })
  })

  it("akzeptiert genau die maximale Notizlänge", () => {
    const note = "x".repeat(DUPLICATE_NOTE_MAX_LENGTH)
    const result = validateDuplicateDecision({ resolution: "RELEASED", note })
    expect(result.valid).toBe(true)
  })

  it("weist eine zu lange Notiz ab, bevor das Backend 400 antwortet", () => {
    const note = "x".repeat(DUPLICATE_NOTE_MAX_LENGTH + 1)
    const result = validateDuplicateDecision({ resolution: "RELEASED", note })
    expect(result.valid).toBe(false)
  })
})

describe("duplicateConfidence", () => {
  it("stuft sehr kurze Abstände als wahrscheinliches Duplikat ein", () => {
    expect(duplicateConfidence(40)).toBe("HIGH")
    expect(duplicateConfidence(120)).toBe("HIGH")
  })

  it("stuft mittlere Abstände als unklar ein", () => {
    expect(duplicateConfidence(121)).toBe("MEDIUM")
    expect(duplicateConfidence(600)).toBe("MEDIUM")
  })

  it("stuft lange Abstände als Nachbestellung ein", () => {
    expect(duplicateConfidence(1500)).toBe("LOW")
  })
})

describe("formatSecondsApart", () => {
  it("formatiert Sekunden, Minuten und gemischte Abstände", () => {
    expect(formatSecondsApart(40)).toBe("40 Sek.")
    expect(formatSecondsApart(120)).toBe("2 Min.")
    expect(formatSecondsApart(725)).toBe("12 Min. 5 Sek.")
  })

  it("fängt negative Werte ab", () => {
    expect(formatSecondsApart(-5)).toBe("0 Sek.")
  })
})

describe("Labels für unvollständige Bestell-Stubs", () => {
  it("nutzt die Gast-E-Mail des Käufers", () => {
    expect(duplicateBuyerLabel(flag())).toBe("kundin@example.com")
  })

  it("fällt auf die gekürzte User-Id zurück", () => {
    const registered = flag({
      order: orderRef({ guestEmail: null, userId: "abcdef12-3456-7890-abcd-ef1234567890" }),
      duplicateOf: orderRef({ guestEmail: null, userId: "abcdef12-3456-7890-abcd-ef1234567890" }),
    })
    expect(duplicateBuyerLabel(registered)).toBe("User abcdef12")
  })

  it("zeigt einen Strich, wenn beide Bestellungen nur Id-Stubs sind", () => {
    const stub = orderRef({
      guestEmail: null,
      userId: null,
      orderNumber: null,
      status: null,
      paymentStatus: null,
      total: null,
      currency: null,
    })
    expect(duplicateBuyerLabel(flag({ order: stub, duplicateOf: stub }))).toBe("–")
  })

  it("fällt bei fehlender Bestellnummer auf die gekürzte Id zurück", () => {
    expect(orderRefLabel(orderRef())).toBe("ORD-1001")
    expect(orderRefLabel(orderRef({ orderNumber: null }))).toBe("11111111")
  })

  it("kürzt die Match-Signatur", () => {
    expect(shortMatchSignature("a".repeat(64))).toBe(`${"a".repeat(12)}…`)
    expect(shortMatchSignature("abc")).toBe("abc")
  })
})

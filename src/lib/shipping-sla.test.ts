import { describe, it, expect } from "vitest"
import {
  formatSlaDeadline,
  formatSlaRemaining,
  hasShippingSla,
  shippingSlaBadgeLabel,
  slaRemainingMs,
} from "./shipping-sla"
import type { ShippingSla } from "@/src/types"

const HOUR = 60 * 60 * 1000
const now = new Date("2026-08-01T12:00:00.000Z")
const deadline = new Date(now.getTime() + 38 * HOUR).toISOString()

function sla(partial: Partial<ShippingSla>): ShippingSla {
  return { status: "PENDING", deadlineAt: deadline, breachedAt: null, ...partial }
}

describe("hasShippingSla", () => {
  it("is false for a missing SLA (order predating #143)", () => {
    expect(hasShippingSla(undefined)).toBe(false)
    expect(hasShippingSla(null)).toBe(false)
  })

  it("is false for NOT_APPLICABLE — nothing must be rendered", () => {
    expect(hasShippingSla(sla({ status: "NOT_APPLICABLE", deadlineAt: null }))).toBe(false)
  })

  it("is true for every state that owes or judges a shipment", () => {
    for (const status of ["PENDING", "BREACHED", "MET", "MISSED"] as const) {
      expect(hasShippingSla(sla({ status }))).toBe(true)
    }
  })
})

describe("slaRemainingMs", () => {
  it("measures against the server deadline, not a client-side guess", () => {
    expect(slaRemainingMs(deadline, now)).toBe(38 * HOUR)
  })

  it("goes negative once the deadline has passed", () => {
    expect(slaRemainingMs(deadline, new Date(now.getTime() + 50 * HOUR))).toBe(-12 * HOUR)
  })
})

describe("formatSlaRemaining", () => {
  it("shows hours when at least one hour remains", () => {
    expect(formatSlaRemaining(deadline, now)).toBe("Versand in 38 h")
  })

  it("shows minutes under one hour", () => {
    const soon = new Date(now.getTime() + 45 * 60 * 1000).toISOString()
    expect(formatSlaRemaining(soon, now)).toBe("Versand in 45 min")
  })

  it("labels overdue once the deadline is in the past", () => {
    const past = new Date(now.getTime() - HOUR).toISOString()
    expect(formatSlaRemaining(past, now)).toBe("Versand überfällig")
  })
})

describe("shippingSlaBadgeLabel", () => {
  it("renders a running deadline as remaining time", () => {
    expect(shippingSlaBadgeLabel(sla({ status: "PENDING" }), now)).toBe("Versand in 38 h")
  })

  it("falls back to the status label when the server sent no deadline", () => {
    expect(shippingSlaBadgeLabel(sla({ status: "PENDING", deadlineAt: null }), now)).toBe(
      "Versandfrist läuft"
    )
  })

  it("labels the terminal states the client heuristic could never express", () => {
    expect(shippingSlaBadgeLabel(sla({ status: "MET" }), now)).toBe("Rechtzeitig versandt")
    expect(shippingSlaBadgeLabel(sla({ status: "MISSED" }), now)).toBe("Verspätet versandt")
  })

  it("labels a breached deadline", () => {
    expect(shippingSlaBadgeLabel(sla({ status: "BREACHED" }), now)).toBe("Versand überfällig")
  })
})

describe("formatSlaDeadline", () => {
  it("formats the deadline as a German date and time", () => {
    // Mittags gewählt, damit die Zusicherung in jeder CI-Zeitzone gilt.
    const formatted = formatSlaDeadline("2026-08-03T12:00:00.000Z")
    expect(formatted).toMatch(/^03\.08\.2026/)
  })
})

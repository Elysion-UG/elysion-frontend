import { describe, it, expect } from "vitest"
import { computeShippingSla, formatSlaRemaining, SHIPPING_SLA_HOURS } from "./shipping-sla"

const HOUR = 60 * 60 * 1000
const base = new Date("2026-08-01T12:00:00.000Z")

describe("computeShippingSla", () => {
  it("sets the deadline 48h after createdAt", () => {
    const sla = computeShippingSla(base.toISOString(), "CONFIRMED", base)
    expect(sla.deadline.getTime()).toBe(base.getTime() + SHIPPING_SLA_HOURS * HOUR)
  })

  it("applies to paid, not-yet-shipped states (CONFIRMED/PROCESSING)", () => {
    expect(computeShippingSla(base.toISOString(), "CONFIRMED", base).applies).toBe(true)
    expect(computeShippingSla(base.toISOString(), "PROCESSING", base).applies).toBe(true)
  })

  it("does not apply once shipped/delivered/cancelled/pending", () => {
    for (const status of ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"] as const) {
      expect(computeShippingSla(base.toISOString(), status, base).applies).toBe(false)
    }
  })

  it("reports remaining time before the deadline", () => {
    const now = new Date(base.getTime() + 10 * HOUR)
    const sla = computeShippingSla(base.toISOString(), "CONFIRMED", now)
    expect(sla.remainingMs).toBe(38 * HOUR)
    expect(sla.isOverdue).toBe(false)
  })

  it("marks overdue when past the deadline and still unshipped", () => {
    const now = new Date(base.getTime() + 50 * HOUR)
    const sla = computeShippingSla(base.toISOString(), "CONFIRMED", now)
    expect(sla.remainingMs).toBeLessThan(0)
    expect(sla.isOverdue).toBe(true)
  })

  it("never marks overdue for a non-applicable state, even past 48h", () => {
    const now = new Date(base.getTime() + 50 * HOUR)
    const sla = computeShippingSla(base.toISOString(), "SHIPPED", now)
    expect(sla.isOverdue).toBe(false)
  })
})

describe("formatSlaRemaining", () => {
  it("shows hours when at least one hour remains", () => {
    expect(formatSlaRemaining(38 * HOUR)).toBe("Versand in 38 h")
  })

  it("shows minutes under one hour", () => {
    expect(formatSlaRemaining(45 * 60 * 1000)).toBe("Versand in 45 min")
  })

  it("labels overdue for negative remaining", () => {
    expect(formatSlaRemaining(-HOUR)).toBe("Versand überfällig")
  })
})

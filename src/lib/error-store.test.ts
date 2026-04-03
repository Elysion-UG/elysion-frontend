import { describe, it, expect, beforeEach, vi } from "vitest"
import { errorStore, type ReportErrorInput } from "./error-store"

function makeInput(overrides: Partial<ReportErrorInput> = {}): ReportErrorInput {
  return {
    severity: "medium",
    category: "api",
    message: "Test error",
    ...overrides,
  }
}

describe("ErrorStore", () => {
  beforeEach(() => {
    errorStore.clear()
  })

  it("reports and retrieves events", () => {
    errorStore.report(makeInput({ message: "err1" }))
    errorStore.report(makeInput({ message: "err2" }))

    const all = errorStore.getAll()
    expect(all).toHaveLength(2)
    expect(all[0].message).toBe("err1")
    expect(all[1].message).toBe("err2")
  })

  it("assigns unique ids and timestamps", () => {
    errorStore.report(makeInput())
    errorStore.report(makeInput())

    const all = errorStore.getAll()
    expect(all[0].id).not.toBe(all[1].id)
    expect(all[0].timestamp).toBeTruthy()
  })

  it("getRecent returns newest first", () => {
    errorStore.report(makeInput({ message: "first" }))
    errorStore.report(makeInput({ message: "second" }))
    errorStore.report(makeInput({ message: "third" }))

    const recent = errorStore.getRecent(2)
    expect(recent).toHaveLength(2)
    expect(recent[0].message).toBe("third")
    expect(recent[1].message).toBe("second")
  })

  it("enforces ring buffer capacity (FIFO eviction)", () => {
    // Report 505 events — only 500 should be kept
    for (let i = 0; i < 505; i++) {
      errorStore.report(makeInput({ message: `err-${i}` }))
    }

    const all = errorStore.getAll()
    expect(all).toHaveLength(500)
    // Oldest 5 should have been evicted
    expect(all[0].message).toBe("err-5")
    expect(all[all.length - 1].message).toBe("err-504")
  })

  it("filters by severity", () => {
    errorStore.report(makeInput({ severity: "critical", message: "crit" }))
    errorStore.report(makeInput({ severity: "low", message: "low" }))
    errorStore.report(makeInput({ severity: "critical", message: "crit2" }))

    const crits = errorStore.getBySeverity("critical")
    expect(crits).toHaveLength(2)
    expect(crits.every((e) => e.severity === "critical")).toBe(true)
  })

  it("filters by category", () => {
    errorStore.report(makeInput({ category: "auth" }))
    errorStore.report(makeInput({ category: "network" }))
    errorStore.report(makeInput({ category: "auth" }))

    const auths = errorStore.getByCategory("auth")
    expect(auths).toHaveLength(2)
    expect(auths.every((e) => e.category === "auth")).toBe(true)
  })

  it("subscribes and unsubscribes", () => {
    const listener = vi.fn()
    const unsub = errorStore.subscribe(listener)

    errorStore.report(makeInput({ message: "a" }))
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0][0].message).toBe("a")

    unsub()
    errorStore.report(makeInput({ message: "b" }))
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("does not crash if listener throws", () => {
    const badListener = vi.fn(() => {
      throw new Error("boom")
    })
    const goodListener = vi.fn()
    errorStore.subscribe(badListener)
    errorStore.subscribe(goodListener)

    errorStore.report(makeInput())

    expect(badListener).toHaveBeenCalledTimes(1)
    expect(goodListener).toHaveBeenCalledTimes(1)
  })

  it("computes stats correctly", () => {
    errorStore.report(makeInput({ severity: "critical", category: "api" }))
    errorStore.report(makeInput({ severity: "critical", category: "auth" }))
    errorStore.report(makeInput({ severity: "high", category: "api" }))
    errorStore.report(makeInput({ severity: "low", category: "network" }))

    const stats = errorStore.getStats()
    expect(stats.total).toBe(4)
    expect(stats.bySeverity.critical).toBe(2)
    expect(stats.bySeverity.high).toBe(1)
    expect(stats.bySeverity.low).toBe(1)
    expect(stats.bySeverity.medium).toBe(0)
    expect(stats.byCategory.api).toBe(2)
    expect(stats.byCategory.auth).toBe(1)
    expect(stats.byCategory.network).toBe(1)
    // All events are recent, so errorsPerMinute should be > 0
    expect(stats.errorsPerMinute).toBeGreaterThan(0)
  })

  it("clear removes all events", () => {
    errorStore.report(makeInput())
    errorStore.report(makeInput())
    expect(errorStore.getAll()).toHaveLength(2)

    errorStore.clear()
    expect(errorStore.getAll()).toHaveLength(0)
    expect(errorStore.getStats().total).toBe(0)
  })

  it("includes url and userAgent in metadata automatically", () => {
    errorStore.report(makeInput({ metadata: { apiPath: "/api/v1/test" } }))

    const event = errorStore.getAll()[0]
    expect(event.metadata.apiPath).toBe("/api/v1/test")
    // In jsdom/test env, these may be present
    expect("url" in event.metadata).toBe(true)
    expect("userAgent" in event.metadata).toBe(true)
  })

  it("prevents infinite loops via isReporting guard", () => {
    // Subscribe a listener that tries to report another error
    const listener = vi.fn(() => {
      errorStore.report(makeInput({ message: "recursive" }))
    })
    errorStore.subscribe(listener)

    errorStore.report(makeInput({ message: "trigger" }))

    // Only the original event should be stored (recursive call is blocked)
    expect(errorStore.getAll()).toHaveLength(1)
    expect(errorStore.getAll()[0].message).toBe("trigger")
  })
})

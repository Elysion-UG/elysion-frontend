import { describe, expect, it } from "vitest"
import { de } from "./de"

describe("de strings catalogue", () => {
  it("exposes the five expected top-level surfaces", () => {
    expect(Object.keys(de).sort()).toEqual(["auth", "common", "errors", "preferences"].sort())
  })

  it("does not leave any string empty", () => {
    const seen: string[] = []
    function walk(obj: Record<string, unknown>, prefix = "") {
      for (const [k, v] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${k}` : k
        if (typeof v === "string") seen.push(`${path}=${v.length}`)
        else if (v && typeof v === "object") walk(v as Record<string, unknown>, path)
        expect(v, `${path} must not be nullish`).toBeDefined()
        if (typeof v === "string")
          expect(v.trim().length, `${path} must not be empty`).toBeGreaterThan(0)
      }
    }
    walk(de as unknown as Record<string, unknown>)
    expect(seen.length).toBeGreaterThan(10)
  })
})

import { describe, it, expect } from "vitest"
import { formatEuro, centsToEuro, euroToCents, bpsToPercent, percentToBps } from "./currency"

describe("currency utils", () => {
  describe("centsToEuro", () => {
    it("converts cents to euro", () => {
      expect(centsToEuro(2999)).toBe(29.99)
      expect(centsToEuro(100)).toBe(1)
      expect(centsToEuro(0)).toBe(0)
    })
  })

  describe("euroToCents", () => {
    it("converts euro to cents", () => {
      expect(euroToCents(29.99)).toBe(2999)
      expect(euroToCents(1)).toBe(100)
    })
  })

  describe("formatEuro", () => {
    it("formats number as EUR string", () => {
      const result = formatEuro(29.99)
      expect(result).toContain("29")
      expect(result).toContain("99")
    })
  })

  describe("bpsToPercent", () => {
    it("converts basis points to percent", () => {
      expect(bpsToPercent(1900)).toBe(19)
      expect(bpsToPercent(500)).toBe(5)
    })
  })

  describe("percentToBps", () => {
    it("converts percent to basis points", () => {
      expect(percentToBps(19)).toBe(1900)
    })
  })
})

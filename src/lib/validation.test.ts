import { describe, it, expect } from "vitest"
import { validatePassword, isValidEmail, PASSWORD_RULES } from "./validation"

describe("validation utils", () => {
  describe("PASSWORD_RULES", () => {
    it("requires at least 8 characters", () => {
      const rule = PASSWORD_RULES.find((r) => r.label.includes("8"))
      expect(rule?.test("1234567")).toBe(false)
      expect(rule?.test("12345678")).toBe(true)
    })
  })

  describe("validatePassword", () => {
    it("returns valid for strong password", () => {
      const result = validatePassword("Secure123")
      expect(result.valid).toBe(true)
    })

    it("returns invalid for weak password", () => {
      const result = validatePassword("weak")
      expect(result.valid).toBe(false)
    })

    it("returns results for each rule", () => {
      const result = validatePassword("test")
      expect(result.results).toHaveLength(PASSWORD_RULES.length)
    })
  })

  describe("isValidEmail", () => {
    it("validates correct email", () => {
      expect(isValidEmail("user@example.com")).toBe(true)
    })

    it("rejects invalid email", () => {
      expect(isValidEmail("not-an-email")).toBe(false)
      expect(isValidEmail("@example.com")).toBe(false)
    })
  })
})

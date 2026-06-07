import { describe, it, expect } from "vitest"
import { toCountryCode, toCountryName } from "./country"

describe("toCountryCode", () => {
  it("converts German country names to ISO codes", () => {
    expect(toCountryCode("Deutschland")).toBe("DE")
    expect(toCountryCode("Österreich")).toBe("AT")
    expect(toCountryCode("Schweiz")).toBe("CH")
    expect(toCountryCode("Frankreich")).toBe("FR")
    expect(toCountryCode("Niederlande")).toBe("NL")
  })

  it("converts English country names to ISO codes", () => {
    expect(toCountryCode("Germany")).toBe("DE")
    expect(toCountryCode("Austria")).toBe("AT")
    expect(toCountryCode("Switzerland")).toBe("CH")
    expect(toCountryCode("United Kingdom")).toBe("GB")
  })

  it("passes through an already 2-char code uppercased", () => {
    expect(toCountryCode("DE")).toBe("DE")
    expect(toCountryCode("de")).toBe("DE")
    expect(toCountryCode("At")).toBe("AT")
  })

  it("returns input unchanged for unrecognised names", () => {
    expect(toCountryCode("Absurdistan")).toBe("Absurdistan")
  })

  it("trims whitespace before matching", () => {
    expect(toCountryCode("  Deutschland  ")).toBe("DE")
  })

  it("handles empty string", () => {
    expect(toCountryCode("")).toBe("")
  })
})

describe("toCountryName", () => {
  it("converts ISO codes to German display names", () => {
    expect(toCountryName("DE")).toBe("Deutschland")
    expect(toCountryName("AT")).toBe("Österreich")
    expect(toCountryName("CH")).toBe("Schweiz")
    expect(toCountryName("GB")).toBe("Vereinigtes Königreich")
  })

  it("is case-insensitive for the code", () => {
    expect(toCountryName("de")).toBe("Deutschland")
    expect(toCountryName("at")).toBe("Österreich")
  })

  it("returns the code unchanged for unknown codes", () => {
    expect(toCountryName("XX")).toBe("XX")
  })

  it("handles empty string", () => {
    expect(toCountryName("")).toBe("")
  })
})

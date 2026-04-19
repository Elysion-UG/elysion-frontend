import { describe, expect, it } from "vitest"
import {
  addressSchema,
  contactSchema,
  loginSchema,
  preferencesSchema,
  productSchema,
  registerSchema,
  zodToFieldErrors,
} from "./schemas"

describe("loginSchema", () => {
  it("accepts a well-formed payload", () => {
    const r = loginSchema.safeParse({ email: "a@b.co", password: "x" })
    expect(r.success).toBe(true)
  })
  it("rejects an empty email", () => {
    const r = loginSchema.safeParse({ email: "", password: "x" })
    expect(r.success).toBe(false)
  })
  it("rejects an invalid email", () => {
    const r = loginSchema.safeParse({ email: "nope", password: "x" })
    expect(r.success).toBe(false)
  })
})

describe("registerSchema", () => {
  const base = {
    firstName: "Ana",
    lastName: "Schmidt",
    email: "ana@example.com",
    password: "Passwort1!",
    confirmPassword: "Passwort1!",
    acceptTerms: true,
  }
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true)
  })
  it("rejects mismatched passwords", () => {
    const r = registerSchema.safeParse({ ...base, confirmPassword: "Different1!" })
    expect(r.success).toBe(false)
  })
  it("rejects weak password", () => {
    const r = registerSchema.safeParse({ ...base, password: "weak", confirmPassword: "weak" })
    expect(r.success).toBe(false)
  })
  it("requires acceptTerms", () => {
    const r = registerSchema.safeParse({ ...base, acceptTerms: false })
    expect(r.success).toBe(false)
  })
})

describe("addressSchema", () => {
  it("accepts a valid address", () => {
    const r = addressSchema.safeParse({
      street: "Hauptstr.",
      houseNumber: "12a",
      postalCode: "10115",
      city: "Berlin",
      country: "DE",
      phone: "",
    })
    expect(r.success).toBe(true)
  })
  it("rejects postal codes with illegal characters", () => {
    const r = addressSchema.safeParse({
      street: "Hauptstr.",
      houseNumber: "12",
      postalCode: "$$$",
      city: "Berlin",
      country: "DE",
    })
    expect(r.success).toBe(false)
  })
})

describe("productSchema", () => {
  it("accepts valid product input", () => {
    const r = productSchema.safeParse({
      title: "T-Shirt",
      description: "Bio-Baumwolle",
      price: 19.9,
      stock: 5,
      categoryId: "shirts",
    })
    expect(r.success).toBe(true)
  })
  it("rejects negative stock", () => {
    const r = productSchema.safeParse({
      title: "X",
      description: "Y",
      price: 10,
      stock: -1,
      categoryId: "c",
    })
    expect(r.success).toBe(false)
  })
  it("rejects zero price", () => {
    const r = productSchema.safeParse({
      title: "X",
      description: "Y",
      price: 0,
      stock: 1,
      categoryId: "c",
    })
    expect(r.success).toBe(false)
  })
})

describe("preferencesSchema", () => {
  it("accepts 'none' profile with null payloads", () => {
    const r = preferencesSchema.safeParse({
      activeProfileType: "none",
      simpleProfile: null,
      extendedProfile: null,
    })
    expect(r.success).toBe(true)
  })
  it("rejects simple type with empty simpleProfile", () => {
    const r = preferencesSchema.safeParse({
      activeProfileType: "simple",
      simpleProfile: {},
      extendedProfile: null,
    })
    expect(r.success).toBe(false)
  })
  it("accepts extended type with valid weights", () => {
    const r = preferencesSchema.safeParse({
      activeProfileType: "extended",
      simpleProfile: null,
      extendedProfile: { oekologisch: { klima: 80 } },
    })
    expect(r.success).toBe(true)
  })
})

describe("contactSchema", () => {
  it("validates a contact message", () => {
    const r = contactSchema.safeParse({
      name: "Ana",
      email: "ana@example.com",
      subject: "Frage",
      message: "Hallo",
    })
    expect(r.success).toBe(true)
  })
})

describe("zodToFieldErrors", () => {
  it("flattens issues by dotted path", () => {
    const r = registerSchema.safeParse({
      firstName: "",
      lastName: "",
      email: "bad",
      password: "weak",
      confirmPassword: "weaker",
      acceptTerms: false,
    })
    if (r.success) throw new Error("expected failure")
    const flat = zodToFieldErrors(r.error)
    expect(flat.firstName).toBeTruthy()
    expect(flat.email).toBeTruthy()
    expect(flat.acceptTerms).toBeTruthy()
  })
})

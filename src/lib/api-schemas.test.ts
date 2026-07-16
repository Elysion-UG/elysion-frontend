import { describe, it, expect } from "vitest"
import { z } from "zod"

import { parseApiResponse, ApiSchemaError, userSchema } from "./api-schemas"
import { ApiError } from "@/src/lib/api-client"

describe("parseApiResponse (#42)", () => {
  const schema = z.object({ id: z.string(), count: z.number() })

  it("returns the parsed value for a valid payload", () => {
    const parsed = parseApiResponse(schema, { id: "x", count: 3 }, "test")
    expect(parsed).toEqual({ id: "x", count: 3 })
  })

  it("throws an ApiSchemaError (an ApiError subclass) on an invalid payload", () => {
    let caught: unknown
    try {
      parseApiResponse(schema, { id: "x", count: "nope" }, "test")
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(ApiSchemaError)
    expect(caught).toBeInstanceOf(ApiError)
    expect((caught as ApiError).status).toBe(0)
  })

  it("carries the Zod issues so callers can inspect what failed", () => {
    try {
      parseApiResponse(schema, { id: 42 }, "test")
      throw new Error("should have thrown")
    } catch (e) {
      const err = e as ApiSchemaError
      expect(err.issues.length).toBeGreaterThan(0)
      // id (wrong type) and count (missing) both fail.
      const paths = err.issues.map((i) => i.path.join("."))
      expect(paths).toContain("id")
      expect(paths).toContain("count")
    }
  })

  it("surfaces a user-safe message that names the label", () => {
    try {
      parseApiResponse(schema, null, "Login")
      throw new Error("should have thrown")
    } catch (e) {
      expect((e as ApiSchemaError).message).toContain("Login")
    }
  })

  it("validates the real userSchema used for auth responses", () => {
    const user = {
      id: "u1",
      email: "a@b.de",
      firstName: "A",
      lastName: "B",
      role: "BUYER",
      emailVerified: true,
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
    }
    expect(parseApiResponse(userSchema, user, "user")).toMatchObject({ id: "u1", role: "BUYER" })
    expect(() => parseApiResponse(userSchema, { ...user, role: "ROOT" }, "user")).toThrow(
      ApiSchemaError
    )
  })
})

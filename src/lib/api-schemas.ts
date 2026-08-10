/**
 * api-schemas.ts — Zod schemas for runtime validation of API responses.
 *
 * The API client trusts the network and casts JSON to the static type. That's
 * fine for normal traffic but masks contract drift: when the backend renames a
 * field or returns an unexpected enum value, the failure surfaces deep in the
 * UI as `undefined.foo` or a silently-wrong status badge.
 *
 * These schemas validate the most-relied-on shapes (auth, status enums) and
 * throw an `ApiSchemaError` when the backend response is incompatible. The
 * helper is opt-in per service call — keep it on the security-critical and
 * status-driven payloads, not every endpoint.
 */
import { z } from "zod"
import { ApiError } from "@/src/lib/api-client"

// ── Enum schemas ─────────────────────────────────────────────────────────────
export const userRoleSchema = z.enum(["BUYER", "SELLER", "ADMIN"])

export const accountStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "PENDING_VERIFICATION",
  "PENDING",
  "DELETED",
])

export const sellerStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"])

/**
 * Interner Produktstatus. Öffentliche Reads liefern ausnahmslos `ACTIVE`; die
 * volle Bandbreite taucht nur in den Seller- und Admin-Reads auf (#227).
 */
export const productStatusSchema = z.enum(["DRAFT", "REVIEW", "ACTIVE", "INACTIVE", "REJECTED"])

export const orderStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
])

export const orderGroupStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
])

/** Read-only Versandfrist-Zustand der Seller-Order-Reads (Backend #143). */
export const shippingSlaStatusSchema = z.enum([
  "NOT_APPLICABLE",
  "PENDING",
  "BREACHED",
  "MET",
  "MISSED",
])

// ── Object schemas ───────────────────────────────────────────────────────────
export const sellerProfileSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  status: sellerStatusSchema,
  vatId: z.string().optional(),
  iban: z.string().optional(),
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  role: userRoleSchema,
  emailVerified: z.boolean(),
  status: accountStatusSchema,
  sellerProfile: sellerProfileSchema.optional(),
  createdAt: z.string(),
})

export const tokensResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: userSchema.nullable(),
  expiresIn: z.number(),
  guestCartMerged: z.boolean().optional(),
})

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Thrown when an API response fails Zod validation. Exposed as an ApiError
 * subclass so existing catch handlers (which already inspect status / message)
 * pick it up without changes.
 */
export class ApiSchemaError extends ApiError {
  readonly issues: z.ZodIssue[]

  constructor(label: string, issues: z.ZodIssue[]) {
    super(0, `Ungültige Server-Antwort (${label}). Bitte später erneut versuchen.`, issues)
    this.name = "ApiSchemaError"
    this.issues = issues
  }
}

/**
 * Validate `data` against `schema`. Returns the parsed value on success;
 * throws `ApiSchemaError` on failure so callers see an ApiError just like
 * any other request error. Logs the issue list to aid debugging.
 */
export function parseApiResponse<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    // Log only in dev, and only path + code — never the received values, which
    // may carry token fragments or other sensitive payload data (#70.4). In
    // production the ApiSchemaError below still surfaces a user-safe message.
    if (process.env.NODE_ENV !== "production" && typeof console !== "undefined") {
      const redacted = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
      }))
      console.error(`[api-schema] validation failed for ${label}`, redacted)
    }
    throw new ApiSchemaError(label, result.error.issues)
  }
  return result.data
}

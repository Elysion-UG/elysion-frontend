import { z } from "zod"
import { PASSWORD_RULES } from "./validation"

// ── Shared building blocks ────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .min(1, "E-Mail ist erforderlich")
  .email("Ungültige E-Mail-Adresse")

const passwordRule = z.string().superRefine((value, ctx) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: rule.label,
      })
    }
  }
})

export const passwordSchema = passwordRule

export const nonEmptyString = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} ist erforderlich`)
    .max(max, `${label} ist zu lang (max. ${max} Zeichen)`)

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+0-9 ()/-]{6,20}$/, "Ungültige Telefonnummer")
  .optional()
  .or(z.literal(""))

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9A-Za-z\- ]{3,10}$/, "Ungültige Postleitzahl")

// ── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Passwort ist erforderlich"),
})
export type LoginInput = z.infer<typeof loginSchema>

// ── Register (buyer, seller) ─────────────────────────────────────────────────

export const registerSchema = z
  .object({
    firstName: nonEmptyString("Vorname", 80),
    lastName: nonEmptyString("Nachname", 80),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Bitte Passwort bestätigen"),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, "AGB und Datenschutz müssen akzeptiert werden"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  })
export type RegisterInput = z.infer<typeof registerSchema>

// ── Address (shipping / billing) ─────────────────────────────────────────────

export const addressSchema = z.object({
  street: nonEmptyString("Strasse", 120),
  houseNumber: nonEmptyString("Hausnummer", 20),
  postalCode: postalCodeSchema,
  city: nonEmptyString("Stadt", 80),
  country: nonEmptyString("Land", 80),
  phone: phoneSchema,
})
export type AddressInput = z.infer<typeof addressSchema>

// ── Product (seller-facing) ──────────────────────────────────────────────────

export const productSchema = z.object({
  title: nonEmptyString("Titel", 200),
  description: nonEmptyString("Beschreibung", 4000),
  price: z
    .number({ message: "Preis ist erforderlich" })
    .positive("Preis muss grösser als 0 sein")
    .max(1_000_000, "Preis ist zu hoch"),
  stock: z
    .number({ message: "Bestand ist erforderlich" })
    .int("Bestand muss eine ganze Zahl sein")
    .min(0, "Bestand darf nicht negativ sein"),
  categoryId: nonEmptyString("Kategorie", 80),
})
export type ProductInput = z.infer<typeof productSchema>

// ── Preferences (buyer value profile) ────────────────────────────────────────

export const valuesProfileTypeSchema = z.enum(["none", "simple", "extended"])

const weight = z.number().int().min(0).max(100)

export const preferencesSchema = z
  .object({
    activeProfileType: valuesProfileTypeSchema,
    simpleProfile: z.record(z.string(), weight).nullable(),
    extendedProfile: z.record(z.string(), z.record(z.string(), weight)).nullable(),
  })
  .refine(
    (v) =>
      v.activeProfileType !== "simple" ||
      (v.simpleProfile && Object.keys(v.simpleProfile).length > 0),
    {
      message: "Einfaches Profil erfordert Gewichte pro Kategorie",
      path: ["simpleProfile"],
    }
  )
  .refine(
    (v) =>
      v.activeProfileType !== "extended" ||
      (v.extendedProfile && Object.keys(v.extendedProfile).length > 0),
    {
      message: "Erweitertes Profil erfordert Gewichte pro Unterkategorie",
      path: ["extendedProfile"],
    }
  )
export type PreferencesInput = z.infer<typeof preferencesSchema>

// ── Contact form ─────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name: nonEmptyString("Name", 120),
  email: emailSchema,
  subject: nonEmptyString("Betreff", 200),
  message: nonEmptyString("Nachricht", 4000),
})
export type ContactInput = z.infer<typeof contactSchema>

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten Zod errors to `{ fieldPath: message }` for form-UI binding. */
export function zodToFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_root"
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

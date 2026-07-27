/**
 * validation.ts — the deliberate client-side UX validation layer.
 *
 * These lightweight helpers (`validatePassword`, `isValidEmail`) are what the
 * forms actually run for immediate user feedback. They are intentionally NOT a
 * security boundary: the backend is the authoritative validator for every write.
 *
 * A parallel set of Zod input schemas (`lib/schemas.ts`) used to exist but was
 * wired to no form — only to its own test — which gave a false sense of
 * validation coverage. It was removed (see #173, F4). If forms are later migrated
 * to react-hook-form, reintroduce Zod schemas via `@hookform/resolvers/zod` and
 * wire them to the forms so the tested rules are the rules that actually run.
 */
export interface PasswordRule {
  label: string
  test: (pw: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: "Mindestens 8 Zeichen", test: (pw) => pw.length >= 8 },
  { label: "Mindestens 1 Grossbuchstabe", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Mindestens 1 Zahl", test: (pw) => /\d/.test(pw) },
  { label: "Mindestens 1 Sonderzeichen", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

export interface PasswordValidationResult {
  valid: boolean
  results: { label: string; passed: boolean }[]
}

export function validatePassword(pw: string): PasswordValidationResult {
  const results = PASSWORD_RULES.map((r) => ({ label: r.label, passed: r.test(pw) }))
  return { valid: results.every((r) => r.passed), results }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

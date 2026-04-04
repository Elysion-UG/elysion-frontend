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

export function validatePassword(pw: string): {
  valid: boolean
  results: { label: string; passed: boolean }[]
} {
  const results = PASSWORD_RULES.map((r) => ({ label: r.label, passed: r.test(pw) }))
  return { valid: results.every((r) => r.passed), results }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Schema-Validierung für benutzergelieferte URLs, die als `href` gerendert werden.
 *
 * React escapet Textinhalte, blockiert aber **keine** `javascript:`- oder
 * `data:`-URLs in Attributen. Eine vom Seller eingegebene Zertifikats-URL
 * landet im Admin-Portal als klickbarer Link — ohne diese Prüfung wäre das ein
 * Privilege-Escalation-Pfad Seller → Admin (#64). Wir erlauben daher nur
 * `http(s):`.
 */

const ALLOWED_URL_PROTOCOLS = ["https:", "http:"] as const

export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  // URLs mit eingebetteten Zugangsdaten ablehnen (https://user:pass@host) —
  // sehen im Admin-Portal wie ein legitimer Link aus, exfiltrieren beim Klick.
  if (parsed.username || parsed.password) return false

  return (ALLOWED_URL_PROTOCOLS as readonly string[]).includes(parsed.protocol)
}

/**
 * Gibt die URL zurück, wenn ihr Schema sicher ist, sonst `null`.
 * Aufrufer rendern bei `null` Plaintext statt eines `<a href>`.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  return isSafeHttpUrl(url) ? (url as string) : null
}

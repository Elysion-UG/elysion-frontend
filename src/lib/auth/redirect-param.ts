/**
 * Post-login return-URL handling (#121).
 *
 * When an unauthenticated visitor is bounced off a protected route — by the
 * middleware (#68) or a client-side guard — the original destination is carried
 * along as a `?redirect=<path>` query parameter so the login flow can send the
 * user back to exactly where they were headed.
 *
 * The parameter is attacker-influencable (it travels in the URL), so every read
 * MUST pass through {@link sanitizeRedirect}: only same-origin, root-relative
 * paths are honoured. Anything else — absolute URLs, protocol-relative
 * `//host`, backslash tricks, control characters — is rejected to prevent an
 * open-redirect (CWE-601).
 */

export const REDIRECT_PARAM = "redirect"

// Reject any ASCII control char (0x00–0x1F), space (0x20) or DEL (0x7F): such a
// character in a redirect value could smuggle a second target or break out of
// the URL context. A char-code scan avoids embedding control chars in a regex
// literal (which would trip `no-control-regex`).
function hasUnsafeChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x20 || code === 0x7f) return true
  }
  return false
}

/**
 * Validate a post-login redirect target. Returns the safe, root-relative path
 * or `null` when the value is missing or unsafe.
 *
 * Accepted: a single leading slash followed by a path (optionally with query
 * and hash), e.g. `/orders/123`, `/checkout?step=2`.
 * Rejected: empty, non-relative (`https://…`), protocol-relative (`//evil`),
 * backslash-smuggled (`/\evil`), or anything carrying control/whitespace chars.
 */
export function sanitizeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null
  // Must be root-relative …
  if (!raw.startsWith("/")) return null
  // … but not protocol-relative or backslash-smuggled, which browsers may treat
  // as an absolute cross-origin URL ("//evil.com", "/\evil.com").
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null
  if (hasUnsafeChar(raw)) return null
  return raw
}

/**
 * Build a login path that carries `target` as a return URL. The target is
 * sanitised first; if it is unsafe or already equals the login path, the bare
 * login path is returned (no redundant `?redirect=`).
 */
export function loginPathWithRedirect(
  loginPath: string,
  target: string | null | undefined
): string {
  const safe = sanitizeRedirect(target)
  if (!safe || safe === loginPath) return loginPath
  return `${loginPath}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}`
}

/**
 * Read and sanitise the redirect target from a query string or URLSearchParams,
 * falling back to `fallback` when absent or unsafe. Safe to call with
 * `window.location.search`.
 */
export function readRedirectTarget(
  search: string | URLSearchParams | null | undefined,
  fallback: string
): string {
  if (!search) return fallback
  const params = typeof search === "string" ? new URLSearchParams(search) : search
  return sanitizeRedirect(params.get(REDIRECT_PARAM)) ?? fallback
}

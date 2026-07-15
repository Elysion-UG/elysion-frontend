/**
 * Minimal typing for Next's bundled path-to-regexp.
 *
 * This is a Next-internal path with no shipped types. It is used deliberately:
 * the rewrite-shadowing test in src/app/api/v1/auth/[...path]/route.test.ts has
 * to reproduce the routing decision Next actually makes (#143). Matching that
 * against a separately installed path-to-regexp could drift from the version
 * Next resolves with — and a test that agrees with the wrong matcher is exactly
 * the failure mode that let the shadowing bug ship.
 *
 * If a Next upgrade moves this path, the import fails loudly at build time
 * rather than silently weakening the test.
 */
declare module "next/dist/compiled/path-to-regexp" {
  export function pathToRegexp(path: string): RegExp
}

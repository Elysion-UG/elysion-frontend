/**
 * Name of the non-sensitive session-presence marker cookie (#68).
 *
 * Unlike the HttpOnly `refreshToken` cookie — which is deliberately scoped to
 * `Path=/api/v1/auth` and is therefore invisible to the middleware on
 * navigation requests — this marker is scoped to `Path=/`. It carries **no
 * token**, only a boolean hint that a refresh session exists, so the middleware
 * can perform a first-line redirect on protected routes.
 *
 * The marker is a defence-in-depth gate, never the authorisation itself: the
 * client-side guards (`AuthGuard` / `SellerGuard` / `AdminGuard`) and the
 * backend remain the real enforcement. A user can delete this cookie, but that
 * only sends them to the login page — it grants no access.
 *
 * Written and cleared exclusively by the auth proxy
 * (`src/app/api/v1/auth/[...path]/route.ts`) in lock-step with the backend's
 * `refreshToken` Set-Cookie, so its lifetime always matches the real session.
 */
export const SESSION_MARKER_COOKIE = "session_present"

/**
 * api-base.ts — the one place that decides where backend requests are sent.
 *
 * Empty (the default) means relative, same-origin paths: the browser talks to
 * this Next app, `next.config.mjs` rewrites `/api/v1/*` to the backend, and
 * `/api/v1/auth/*` goes through the auth proxy that maintains the refresh
 * cookie and its session_present marker. Setting NEXT_PUBLIC_API_URL opts out
 * of all of that and points the browser straight at the backend instead.
 *
 * This module exists because that decision used to be spelled out separately in
 * every consumer, and the spellings disagreed: api-client defaulted to relative
 * (`?? ""`), while error-store and env.ts defaulted to `http://localhost:8080`
 * (`|| "…"`). Emptying NEXT_PUBLIC_API_URL on staging therefore did not switch
 * the app to proxy mode — it switched error-store to posting at localhost from
 * a deployed page, which the CSP then blocked (#148).
 *
 * A default only belongs here. Consumers append their path and nothing else.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

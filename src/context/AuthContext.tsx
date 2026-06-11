"use client"

import type React from "react"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react"
import type {
  User,
  LoginDTO,
  RegisterDTO,
  UserRole,
  SellerStatus,
  TokensResponse,
} from "@/src/types"
import { AuthService } from "@/src/services/auth.service"
import {
  ApiError,
  setAccessToken,
  refreshSession,
  saveAuthSession,
  loadAuthSession,
  clearAuthSession,
  bumpAuthGeneration,
  getAuthGeneration,
  decodeJwtClaims,
  type AuthPortal,
} from "@/src/lib/api-client"
import { useEffectEvent } from "@/src/hooks/use-effect-event"

// ── Helpers ────────────────────────────────────────────────────────────────────

function isValidUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false
  const u = value as Record<string, unknown>
  return typeof u.id === "string" && typeof u.email === "string" && typeof u.role === "string"
}

/**
 * Builds a minimal User stub from access-token claims when neither the refresh
 * response nor /users/me yielded a user object (e.g. ADMIN tokens that get 403
 * on /users/me). The token has already been accepted by the backend, so the
 * claimed role is trustworthy enough for UI gating. firstName/lastName remain
 * empty placeholders — they aren't load-bearing for AuthGuard / AdminGuard /
 * SellerGuard, and the rest of the UI shows them as " " harmlessly.
 */
function userFromAccessToken(accessToken: string): User | null {
  const claims = decodeJwtClaims(accessToken)
  if (!claims) return null
  if (claims.role !== "BUYER" && claims.role !== "SELLER" && claims.role !== "ADMIN") {
    return null
  }
  return {
    id: claims.sub,
    email: claims.email,
    firstName: "",
    lastName: "",
    role: claims.role,
    emailVerified: true,
    status: "ACTIVE",
    createdAt: claims.iat ? new Date(claims.iat * 1000).toISOString() : new Date(0).toISOString(),
  }
}

/**
 * Backoff-Verzögerungen für transiente Refresh-Fehler beim Session-Restore.
 * Nur ein definitives 401 bedeutet „Refresh-Cookie ungültig" — Netzwerkfehler
 * (Status 0), 429 und 5xx (z. B. Staging-Kaltstart) dürfen die Session nicht
 * sofort beenden (#89).
 */
export const SESSION_RESTORE_RETRY_DELAYS_MS = [1_000, 3_000]

/**
 * Transient = der Refresh-Cookie ist möglicherweise noch gültig, nur die
 * Zustellung ist gescheitert: Netzwerkfehler (Status 0), Rate-Limit (429)
 * oder Server-/Infrastrukturfehler (5xx). Alles andere — insbesondere 401 —
 * ist eine definitive Ablehnung des Cookies.
 */
function isTransientRefreshError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 0 || err.status === 429 || err.status >= 500)
}

// ── Context ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole | null
  sellerStatus: SellerStatus | null
  login: (dto: LoginDTO, portal: AuthPortal) => Promise<UserRole>
  register: (dto: RegisterDTO) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // true until session restore completes

  // ── Phase 1: synchronous sessionStorage restore (before first paint) ──────────
  //
  // Restores the user object optimistically so components that depend on
  // user identity (e.g. personalised greetings) can render without waiting
  // for the network. The access token is intentionally NOT stored in
  // sessionStorage (H-S3) — Phase 2 always fetches a fresh one via the
  // HttpOnly refresh cookie. isLoading stays true until Phase 2 completes.
  const restoreSession = useEffectEvent(() => {
    const persisted = loadAuthSession()
    if (!persisted) return
    if (isValidUser(persisted.user)) {
      setUser(persisted.user)
    }
  })

  useLayoutEffect(() => {
    restoreSession()
  }, [])

  // ── Phase 2: async token fetch on every page load ──────────────────────────
  //
  // Always runs — even when Phase 1 restored a user from sessionStorage —
  // because the access token is never persisted. A fresh token is obtained
  // from the HttpOnly refresh cookie on every cold start / page reload.
  //
  // The generation guard prevents a stale resolve from restoring auth state
  // after a logout that happened while this refresh was in flight.
  useEffect(() => {
    const gen = getAuthGeneration()
    let cancelled = false

    // Transiente Fehler (Netzwerk, 429, 5xx) mit Backoff erneut versuchen —
    // eine definitive Ablehnung (401) bricht sofort ab. isLoading bleibt
    // während der Retries true, sodass Guards den Spinner statt des
    // Login-Prompts zeigen.
    const refreshWithRetry = async (): Promise<unknown> => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await refreshSession()
        } catch (err) {
          const outOfRetries = attempt >= SESSION_RESTORE_RETRY_DELAYS_MS.length
          if (
            !isTransientRefreshError(err) ||
            outOfRetries ||
            cancelled ||
            gen !== getAuthGeneration()
          ) {
            throw err
          }
          await new Promise((resolve) =>
            setTimeout(resolve, SESSION_RESTORE_RETRY_DELAYS_MS[attempt])
          )
          // Während des Sleeps kann unmount/logout passiert sein — vor dem
          // nächsten Netzwerk-Call erneut prüfen.
          if (cancelled || gen !== getAuthGeneration()) throw err
        }
      }
    }

    refreshWithRetry()
      .then(async (res) => {
        if (gen !== getAuthGeneration()) return // logout happened mid-refresh
        const tokens = res as TokensResponse
        setToken(tokens.accessToken)
        setAccessToken(tokens.accessToken)

        if (tokens.user) {
          const portal: AuthPortal =
            tokens.user.role === "SELLER"
              ? "seller"
              : tokens.user.role === "ADMIN"
                ? "admin"
                : "customer"
          setUser(tokens.user)
          saveAuthSession(tokens.user, portal)
        } else {
          // Backend refresh didn't return a user — try /users/me as fallback.
          // Some portal tokens (notably ADMIN) get 403 on /users/me even though
          // the access token itself is valid. We fall back in this order:
          //   1) persisted user from sessionStorage (richest data — set during login)
          //   2) JWT claims of the fresh access token (lean stub, role-correct)
          //   3) log out inline — NICHT zum äußeren .catch propagieren, sonst
          //      würde z. B. ein 503 von /users/me dort fälschlich als
          //      transienter REFRESH-Fehler klassifiziert (#89-Review).
          // The access token has already been accepted by the backend, so trusting
          // its claims for role-gated UI is safe.
          try {
            const { UserService } = await import("@/src/services/user.service")
            const freshUser = await UserService.getCurrentUser()
            if (gen !== getAuthGeneration()) return
            const portal: AuthPortal =
              freshUser.role === "SELLER"
                ? "seller"
                : freshUser.role === "ADMIN"
                  ? "admin"
                  : "customer"
            setUser(freshUser)
            saveAuthSession(freshUser, portal)
          } catch (err) {
            if (gen !== getAuthGeneration()) return
            const persisted = loadAuthSession()
            if (persisted && isValidUser(persisted.user)) {
              setUser(persisted.user)
            } else {
              const stub = userFromAccessToken(tokens.accessToken)
              if (!stub) {
                // User-Identität nicht auflösbar — definitiv ausloggen.
                setAccessToken(null)
                setToken(null)
                setUser(null)
                clearAuthSession()
                return
              }
              const portal: AuthPortal =
                stub.role === "SELLER" ? "seller" : stub.role === "ADMIN" ? "admin" : "customer"
              setUser(stub)
              saveAuthSession(stub, portal)
            }
          }
        }
      })
      .catch(async (err: unknown) => {
        if (gen !== getAuthGeneration()) return
        setAccessToken(null)
        setToken(null)

        // Transienter Fehler (Netzwerk 0, 429, 5xx): persistierte Session und
        // optimistisch wiederhergestellten User behalten, damit der nächste
        // Reload/Request die Session über den Refresh-Cookie wiederherstellen
        // kann — kein stiller Logout durch Verbindungsprobleme (#89).
        if (isTransientRefreshError(err)) {
          const persisted = loadAuthSession()
          if (persisted) {
            const { toast } = await import("sonner")
            if (gen !== getAuthGeneration()) return // Auth-Wechsel während Import
            toast.error("Sitzung konnte nicht wiederhergestellt werden — bitte Seite neu laden.")
          }
          return
        }

        // Definitives 401: kein gültiger Refresh-Cookie — ausgeloggt bleiben.
        setUser(null)
        clearAuthSession()
      })
      .finally(() => {
        if (gen !== getAuthGeneration()) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const isAuthenticated = !!token && !!user
  const role = user?.role ?? null
  const sellerStatus = user?.sellerProfile?.status ?? null

  // No background setInterval refresh — proactive-on-request (<120s remaining)
  // and reactive 401-retry in api-client cover the refresh needs. Idle tabs
  // no longer compete with tab-focus refreshes for the single-use refresh
  // cookie, which eliminated a race where two rotations invalidated each other.

  const login = useCallback(async (dto: LoginDTO, portal: AuthPortal): Promise<UserRole> => {
    setIsLoading(true)
    try {
      const loginFn =
        portal === "seller"
          ? AuthService.loginAsSeller
          : portal === "admin"
            ? AuthService.loginAsAdmin
            : AuthService.loginAsCustomer
      const res = await loginFn(dto)
      // login response always includes user
      const loggedInUser = res.user!
      // Bump generation so any in-flight refreshes from the previous auth state
      // don't overwrite this fresh token when they resolve.
      bumpAuthGeneration()
      setUser(loggedInUser)
      setToken(res.accessToken)
      setAccessToken(res.accessToken)
      saveAuthSession(loggedInUser, portal)

      if (res.guestCartMerged) {
        const { toast } = await import("sonner")
        toast.info("Dein Warenkorb wurde mit deinem Konto zusammengeführt.")
      }

      return loggedInUser.role
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (dto: RegisterDTO) => {
    setIsLoading(true)
    try {
      await AuthService.register(dto)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    // Bump generation FIRST so any in-flight refresh resolve is discarded
    // before it can re-apply a token after state has been cleared.
    bumpAuthGeneration()
    setIsLoading(true)
    try {
      await AuthService.logout()
    } catch {
      // 401 "Missing refresh token" is expected when the session already expired.
      // Local logout (clearing state) always succeeds regardless.
    } finally {
      setUser(null)
      setToken(null)
      setAccessToken(null)
      clearAuthSession()
      setIsLoading(false)
    }
  }, [])

  const refreshTokenFn = useCallback(async () => {
    if (!token) return
    // Route through the shared, deduplicated refreshSession() so this call
    // coalesces with any in-flight refresh triggered by api-client's proactive
    // or 401-retry paths. Capturing the generation guards against late-apply
    // after a concurrent logout.
    const gen = getAuthGeneration()
    try {
      const tokens = await refreshSession()
      if (gen !== getAuthGeneration()) return
      setToken(tokens.accessToken)
      setAccessToken(tokens.accessToken)
      if (user) {
        const persisted = loadAuthSession()
        const portal = persisted?.portal ?? "customer"
        saveAuthSession(user, portal)
      }
    } catch {
      if (gen !== getAuthGeneration()) return
      bumpAuthGeneration()
      setUser(null)
      setToken(null)
      clearAuthSession()
    }
  }, [token, user])

  const handleSetUser = useCallback(
    (u: User) => {
      setUser(u)
      if (token) {
        const persisted = loadAuthSession()
        const portal = persisted?.portal ?? "customer"
        saveAuthSession(u, portal)
      }
    },
    [token]
  )

  // Stable context value: without useMemo, every AuthProvider render would
  // create a new object and cascade-re-render every useAuth consumer.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      role,
      sellerStatus,
      login,
      register,
      logout,
      refreshToken: refreshTokenFn,
      setUser: handleSetUser,
    }),
    [
      user,
      token,
      isAuthenticated,
      isLoading,
      role,
      sellerStatus,
      login,
      register,
      logout,
      refreshTokenFn,
      handleSetUser,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

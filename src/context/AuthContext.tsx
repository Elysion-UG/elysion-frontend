"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useLayoutEffect } from "react"
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
  setAccessToken,
  refreshSession,
  saveAuthSession,
  loadAuthSession,
  clearAuthSession,
  bumpAuthGeneration,
  getAuthGeneration,
  type AuthPortal,
} from "@/src/lib/api-client"

// ── Helpers ────────────────────────────────────────────────────────────────────

function isValidUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false
  const u = value as Record<string, unknown>
  return typeof u.id === "string" && typeof u.email === "string" && typeof u.role === "string"
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
  useLayoutEffect(() => {
    const persisted = loadAuthSession()
    if (!persisted) return
    if (isValidUser(persisted.user)) {
      setUser(persisted.user)
    }
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
    refreshSession()
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
          // Backend refresh didn't return a user — fall back to /users/me.
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
        }
      })
      .catch(() => {
        if (gen !== getAuthGeneration()) return
        // No valid refresh cookie — stay logged out.
        setAccessToken(null)
        setUser(null)
        setToken(null)
        clearAuthSession()
      })
      .finally(() => {
        if (gen !== getAuthGeneration()) return
        setIsLoading(false)
      })
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

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

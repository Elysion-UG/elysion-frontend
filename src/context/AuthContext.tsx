"use client"

/**
 * AuthContext — real authentication state management.
 *
 * Session lifecycle:
 *   Mount  → POST /api/v1/auth/refresh (HttpOnly cookie sent automatically)
 *            → if ok: store accessToken in memory, GET /api/v1/users/me → set user
 *   Login  → POST /api/v1/auth/login → store accessToken → GET /api/v1/users/me
 *   Logout → POST /api/v1/auth/logout → clear token + user
 *
 * Access token is in module memory (not localStorage) for XSS safety.
 * Refresh token is an HttpOnly cookie — the browser manages it automatically.
 */

import type React from "react"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react"
import type { User, LoginDTO, RegisterDTO, UserRole, SellerStatus } from "@/src/types"
import { AuthService } from "@/src/services/auth.service"
import { UserService } from "@/src/services/user.service"
import { setAccessToken, setOnUnauthorized, ApiError } from "@/src/lib/api-client"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole | null
  sellerStatus: SellerStatus | null
  login: (dto: LoginDTO) => Promise<void>
  register: (dto: RegisterDTO) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  // Start loading=true so we restore session before rendering protected content
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const isAuthenticated = !!user
  const role = user?.role ?? null
  const sellerStatus = user?.sellerProfile?.status ?? null

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUserState(null)
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current)
      refreshTimer.current = null
    }
  }, [])

  const fetchAndSetUser = useCallback(async (): Promise<void> => {
    const me = await UserService.getCurrentUser()
    setUserState(me)
  }, [])

  // Schedule automatic token refresh every 45 min (backend TTL = 60 min)
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current)
    refreshTimer.current = setInterval(async () => {
      try {
        const tokens = await AuthService.refresh()
        setAccessToken(tokens.accessToken)
      } catch {
        clearSession()
      }
    }, 45 * 60 * 1000)
  }, [clearSession])

  // ── Register global 401 handler ──────────────────────────────────────────

  useEffect(() => {
    setOnUnauthorized(async () => {
      try {
        const tokens = await AuthService.refresh()
        setAccessToken(tokens.accessToken)
        return true
      } catch {
        clearSession()
        return false
      }
    })
    return () => setOnUnauthorized(null)
  }, [clearSession])

  // ── Restore session on mount ──────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const tokens = await AuthService.refresh()
        if (cancelled) return
        setAccessToken(tokens.accessToken)
        await fetchAndSetUser()
        scheduleRefresh()
      } catch {
        // No valid session (first visit, or cookie expired) — normal state.
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    restoreSession()
    return () => { cancelled = true }
  }, [fetchAndSetUser, scheduleRefresh, clearSession])

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(
    async (dto: LoginDTO) => {
      setIsLoading(true)
      try {
        const tokens = await AuthService.login(dto)
        setAccessToken(tokens.accessToken)
        await fetchAndSetUser()
        scheduleRefresh()
      } finally {
        setIsLoading(false)
      }
    },
    [fetchAndSetUser, scheduleRefresh]
  )

  const register = useCallback(async (dto: RegisterDTO) => {
    setIsLoading(true)
    try {
      await AuthService.register(dto)
      // Registration triggers a verification email. User is NOT logged in yet.
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await AuthService.logout()
    } catch (e) {
      // Ignore logout errors (e.g. already-expired session)
      if (!(e instanceof ApiError)) throw e
    } finally {
      clearSession()
      setIsLoading(false)
    }
  }, [clearSession])

  const setUser = useCallback((u: User) => {
    setUserState(u)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        role,
        sellerStatus,
        login,
        register,
        logout,
        setUser,
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

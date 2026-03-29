"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import type { User, LoginDTO, RegisterDTO, UserRole, SellerStatus } from "@/src/types"
import { AuthService } from "@/src/services/auth.service"
import {
  setAccessToken,
  refreshSession,
  saveAuthSession,
  loadAuthSession,
  clearAuthSession,
} from "@/src/lib/api-client"

// ── Context ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole | null
  sellerStatus: SellerStatus | null
  login: (dto: LoginDTO) => Promise<void>
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
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Restore session on mount.
  // Strategy:
  //   1. Check sessionStorage for a previously saved token + user.
  //      If found, apply it immediately so the UI shows the correct auth state
  //      without waiting for a network round-trip.
  //   2. Then attempt a backend refresh in the background to rotate the token.
  //      If the backend refresh succeeds: update with the fresh token.
  //      If it fails (no cookie, cross-origin issue, expired): keep the
  //      sessionStorage token as-is — the user stays logged in for this tab.
  useEffect(() => {
    const persisted = loadAuthSession()

    if (persisted) {
      console.log("[auth] mount — restoring React state from sessionStorage")
      // _accessToken is ALREADY set at module-load time (api-client.ts init).
      // Here we just sync the React state (user, token, isLoading).
      setUser(persisted.user as User)
      setToken(persisted.token)
      setIsLoading(false)

      // Background refresh to rotate the token if the backend supports it.
      // Keep the persisted user as fallback — the refresh endpoint may not
      // return a user object (some backends only return accessToken + expiresIn).
      refreshSession()
        .then((res) => {
          const tokens = res as import("@/src/types").TokensResponse
          const freshUser = (tokens.user ?? persisted.user) as User
          console.log(
            "[auth] background refresh success — user from response:",
            tokens.user ? "present" : "absent, keeping persisted"
          )
          setUser(freshUser)
          setToken(tokens.accessToken)
          setAccessToken(tokens.accessToken)
          saveAuthSession(tokens.accessToken, freshUser)
        })
        .catch(() => {
          // Refresh failed — keep the sessionStorage token; it may still be
          // valid for the remainder of its TTL.
        })
      return
    }

    // No sessionStorage entry — cold start, try the backend refresh cookie.
    console.log("[auth] mount — no sessionStorage, attempting backend refresh")
    refreshSession()
      .then(async (res) => {
        const tokens = res as import("@/src/types").TokensResponse
        setToken(tokens.accessToken)
        setAccessToken(tokens.accessToken)

        if (tokens.user) {
          setUser(tokens.user)
          saveAuthSession(tokens.accessToken, tokens.user)
        } else {
          // Backend's refresh endpoint didn't return a user — fetch it separately
          const { UserService } = await import("@/src/services/user.service")
          const freshUser = await UserService.getCurrentUser()
          setUser(freshUser)
          saveAuthSession(tokens.accessToken, freshUser)
        }
      })
      .catch(() => {
        // No valid session — stay logged out
      })
      .finally(() => setIsLoading(false))
  }, [])

  const isAuthenticated = !!token && !!user
  const role = user?.role ?? null
  const sellerStatus = user?.sellerProfile?.status ?? null

  // Token refresh interval — fires every 10 min
  useEffect(() => {
    if (token) {
      refreshTimer.current = setInterval(
        async () => {
          try {
            const res = await AuthService.refresh()
            setToken(res.accessToken)
            setAccessToken(res.accessToken)
            if (user) saveAuthSession(res.accessToken, user)
          } catch {
            setUser(null)
            setToken(null)
            clearAuthSession()
          }
        },
        10 * 60 * 1000
      )
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [token, user])

  const login = useCallback(async (dto: LoginDTO) => {
    setIsLoading(true)
    try {
      const res = await AuthService.login(dto)
      setUser(res.user)
      setToken(res.accessToken)
      setAccessToken(res.accessToken)
      saveAuthSession(res.accessToken, res.user)
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
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [])

  const refreshTokenFn = useCallback(async () => {
    if (!token) return
    try {
      const res = await AuthService.refresh()
      setToken(res.accessToken)
      setAccessToken(res.accessToken)
      if (user) saveAuthSession(res.accessToken, user)
    } catch {
      setUser(null)
      setToken(null)
      clearAuthSession()
    }
  }, [token, user])

  const handleSetUser = useCallback(
    (u: User) => {
      setUser(u)
      if (token) saveAuthSession(token, u)
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

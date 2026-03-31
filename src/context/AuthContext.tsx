"use client"

import type React from "react"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react"
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

  // ── Phase 1: synchronous sessionStorage restore (before first paint) ──────────
  //
  // useLayoutEffect runs after DOM mutations but before the browser paints.
  // If a session exists in sessionStorage we can resolve auth state here,
  // which means the navbar renders in the correct logged-in/out state on the
  // very first frame — no spinner flash for returning users.
  //
  // _accessToken is already seeded at module-load time by api-client.ts, so
  // we only need to sync the React state (user, token, isLoading).
  useLayoutEffect(() => {
    const persisted = loadAuthSession()
    if (!persisted) return // nothing to restore synchronously — Phase 2 handles this

    console.log("[auth] mount — restoring React state from sessionStorage")
    setUser(persisted.user as User)
    setToken(persisted.token)
    setIsLoading(false)
  }, [])

  // ── Phase 2: async background work after paint ─────────────────────────────
  //
  // Two cases:
  //   a) Session existed  → rotate the token in the background (silent, non-blocking)
  //   b) No session       → cold start; try the HttpOnly refresh cookie once
  //
  // Both paths are intentionally async so they never block the first render.
  useEffect(() => {
    const persisted = loadAuthSession()

    if (persisted) {
      // Background token rotation — keep persisted user if the endpoint
      // doesn't return one.
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
          // Refresh failed — keep the sessionStorage token for its remaining TTL.
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
          // Backend's refresh endpoint didn't return a user — fetch it separately.
          const { UserService } = await import("@/src/services/user.service")
          const freshUser = await UserService.getCurrentUser()
          setUser(freshUser)
          saveAuthSession(tokens.accessToken, freshUser)
        }
      })
      .catch(() => {
        // No valid session — stay logged out.
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

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
  type AuthPortal,
} from "@/src/lib/api-client"

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

    setUser(persisted.user as User)
    setToken(persisted.token)
    setIsLoading(false)
  }, [])

  // ── Phase 2: async background work after paint ─────────────────────────────
  //
  // Two cases:
  //   a) Session existed  → already restored synchronously in Phase 1; nothing to do.
  //                         The access token is guaranteed valid here: isJwtExpired()
  //                         at module-load time already cleared any expired session
  //                         before Phase 1 ran. Background rotation is handled by the
  //                         periodic timer (every 10 min) and the api-client 401
  //                         interceptor — no need to call refresh on every page load.
  //   b) No session       → cold start; try the HttpOnly refresh cookie once.
  useEffect(() => {
    const persisted = loadAuthSession()

    if (persisted) {
      // Phase 1 already restored the session. Token is valid. Nothing to do.
      return
    }

    // No sessionStorage entry — cold start, try the backend refresh cookie.
    refreshSession()
      .then(async (res) => {
        const tokens = res as import("@/src/types").TokensResponse
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
          saveAuthSession(tokens.accessToken, tokens.user, portal)
        } else {
          // Backend refresh didn't return a user — fall back to /users/me.
          const { UserService } = await import("@/src/services/user.service")
          const freshUser = await UserService.getCurrentUser()
          const portal: AuthPortal =
            freshUser.role === "SELLER"
              ? "seller"
              : freshUser.role === "ADMIN"
                ? "admin"
                : "customer"
          setUser(freshUser)
          saveAuthSession(tokens.accessToken, freshUser, portal)
        }
      })
      .catch(() => {
        // No valid refresh cookie — stay logged out.
        setAccessToken(null)
        setUser(null)
        setToken(null)
        clearAuthSession()
      })
      .finally(() => setIsLoading(false))
  }, [])

  const isAuthenticated = !!token && !!user
  const role = user?.role ?? null
  const sellerStatus = user?.sellerProfile?.status ?? null

  // Token refresh interval — fires every 10 min, retries up to 2× before logging out
  useEffect(() => {
    if (token) {
      refreshTimer.current = setInterval(
        async () => {
          const maxRetries = 2
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              const res = await AuthService.refresh()
              setToken(res.accessToken)
              setAccessToken(res.accessToken)
              if (user) {
                const persisted = loadAuthSession()
                const portal = persisted?.portal ?? "customer"
                saveAuthSession(res.accessToken, user, portal)
              }
              return // success — exit
            } catch {
              if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, (attempt + 1) * 3000))
              } else {
                // All retries exhausted — log out
                setUser(null)
                setToken(null)
                setAccessToken(null)
                clearAuthSession()
              }
            }
          }
        },
        10 * 60 * 1000
      )
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [token, user])

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
      setUser(loggedInUser)
      setToken(res.accessToken)
      setAccessToken(res.accessToken)
      saveAuthSession(res.accessToken, loggedInUser, portal)

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
      if (user) {
        const persisted = loadAuthSession()
        const portal = persisted?.portal ?? "customer"
        saveAuthSession(res.accessToken, user, portal)
      }
    } catch {
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
        saveAuthSession(token, u, portal)
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

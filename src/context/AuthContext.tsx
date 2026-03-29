"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import type { User, LoginDTO, RegisterDTO, UserRole, SellerStatus } from "@/src/types"
import { AuthService } from "@/src/services/auth.service"
import { setAccessToken, refreshSession } from "@/src/lib/api-client"

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

  // Restore session on mount — uses refreshSession() which deduplicates the
  // refresh call so CartContext or any other concurrent 401 retry shares the
  // same in-flight promise instead of racing with a separate refresh request.
  useEffect(() => {
    refreshSession()
      .then((res) => {
        const tokens = res as import("@/src/types").TokensResponse
        setUser(tokens.user)
        setToken(tokens.accessToken)
        setAccessToken(tokens.accessToken)
      })
      .catch(() => {
        // No valid session — stay logged out
      })
      .finally(() => setIsLoading(false))
  }, [])

  const isAuthenticated = !!token && !!user
  const role = user?.role ?? null
  const sellerStatus = user?.sellerProfile?.status ?? null

  // Token refresh interval — conceptual, fires every 10 min
  useEffect(() => {
    if (token) {
      refreshTimer.current = setInterval(
        async () => {
          try {
            const res = await AuthService.refresh()
            setToken(res.accessToken)
          } catch {
            // If refresh fails, log out
            setUser(null)
            setToken(null)
          }
        },
        10 * 60 * 1000
      )
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [token])

  const login = useCallback(async (dto: LoginDTO) => {
    setIsLoading(true)
    try {
      const res = await AuthService.login(dto)
      setUser(res.user)
      setToken(res.accessToken)
      setAccessToken(res.accessToken)
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
    } finally {
      setUser(null)
      setToken(null)
      setAccessToken(null)
      setIsLoading(false)
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [])

  const refreshTokenFn = useCallback(async () => {
    if (!token) return
    try {
      const res = await AuthService.refresh()
      setToken(res.accessToken)
    } catch {
      setUser(null)
      setToken(null)
    }
  }, [token])

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

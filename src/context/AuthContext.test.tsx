import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import { AuthProvider, useAuth } from "./AuthContext"
import type { LoginDTO, RegisterDTO, User, TokensResponse } from "@/src/types"

// ── Mock AuthService ───────────────────────────────────────────────────────────

vi.mock("@/src/services/auth.service", () => ({
  AuthService: {
    loginAsCustomer: vi.fn(),
    loginAsSeller: vi.fn(),
    loginAsAdmin: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
  },
}))

// Mock api-client to control refreshSession directly and avoid the module-level
// _refreshInFlight cache bleeding between tests. All session-storage helpers are
// mocked as no-ops so tests control sessionStorage themselves via the Web API.
vi.mock("@/src/lib/api-client", () => ({
  setAccessToken: vi.fn(),
  refreshSession: vi.fn(),
  saveAuthSession: vi.fn(),
  loadAuthSession: vi.fn().mockReturnValue(null),
  clearAuthSession: vi.fn(),
  AUTH_SESSION_KEY: "auth_session",
}))

// Import AFTER mock so we get the mocked version
import { AuthService } from "@/src/services/auth.service"
import {
  refreshSession,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
} from "@/src/lib/api-client"

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: "user-001",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  role: "BUYER",
  emailVerified: true,
  status: "ACTIVE",
  createdAt: "2024-01-01T00:00:00Z",
}

const mockTokensResponse: TokensResponse = {
  accessToken: "access-token-abc",
  user: mockUser,
  expiresIn: 3600,
}

// ── Wrapper ────────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

// Default: refreshSession rejects immediately (no active session).
// Individual tests override this when they need specific session-restore behaviour.
// Clear sessionStorage so persisted auth state doesn't bleed between tests.
beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(refreshSession).mockRejectedValue(new Error("no session"))
})

// ── Initial state ──────────────────────────────────────────────────────────────

describe("AuthContext — initial state", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(refreshSession).mockRejectedValue(new Error("no session"))
  })

  it("starts with user = null", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it("starts with token = null", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.token).toBeNull()
  })

  it("starts with isAuthenticated = false", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("starts with isLoading = true (session restore in progress)", () => {
    // isLoading is true from mount until refreshSession() settles.
    // This is intentional — it prevents a "logged out" flash on page reload.
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it("starts with role = null", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.role).toBeNull()
  })

  it("starts with sellerStatus = null", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.sellerStatus).toBeNull()
  })
})

// ── useAuth guard ──────────────────────────────────────────────────────────────

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    const consoleError = console.error
    console.error = () => {}
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider")
    console.error = consoleError
  })
})

// ── login ──────────────────────────────────────────────────────────────────────

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(refreshSession).mockRejectedValue(new Error("no session"))
    vi.mocked(AuthService.loginAsCustomer).mockResolvedValue(mockTokensResponse)
  })

  it("calls AuthService.loginAsCustomer when portal is 'customer'", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const dto: LoginDTO = { email: "jane@example.com", password: "secret" }

    await act(async () => {
      await result.current.login(dto, "customer")
    })

    expect(AuthService.loginAsCustomer).toHaveBeenCalledOnce()
    expect(AuthService.loginAsCustomer).toHaveBeenCalledWith(dto)
  })

  it("sets user after a successful login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {}) // flush Phase 2 (refreshSession settle)

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it("sets token after a successful login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(result.current.token).toBe("access-token-abc")
  })

  it("sets isAuthenticated to true after login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it("sets role from the returned user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(result.current.role).toBe("BUYER")
  })

  it("resets isLoading to false after login completes", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("resets isLoading to false even when login throws", async () => {
    vi.mocked(AuthService.loginAsCustomer).mockRejectedValue(new Error("Invalid credentials"))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      try {
        await result.current.login({ email: "bad@example.com", password: "wrong" }, "customer")
      } catch {
        // expected
      }
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("propagates errors thrown by the login service", async () => {
    const loginError = new Error("Invalid credentials")
    vi.mocked(AuthService.loginAsCustomer).mockRejectedValue(loginError)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login({ email: "bad@example.com", password: "wrong" }, "customer")
      })
    ).rejects.toThrow("Invalid credentials")
  })

  it("saves token, user, and portal to sessionStorage after login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(saveAuthSession).toHaveBeenCalledOnce()
    expect(saveAuthSession).toHaveBeenCalledWith("access-token-abc", mockUser, "customer")
  })

  it("calls AuthService.loginAsSeller when portal is 'seller'", async () => {
    const sellerUser: User = { ...mockUser, role: "SELLER" }
    vi.mocked(AuthService.loginAsSeller).mockResolvedValue({
      ...mockTokensResponse,
      user: sellerUser,
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    const dto: LoginDTO = { email: "seller@example.com", password: "secret" }

    await act(async () => {
      await result.current.login(dto, "seller")
    })

    expect(AuthService.loginAsSeller).toHaveBeenCalledOnce()
    expect(AuthService.loginAsSeller).toHaveBeenCalledWith(dto)
  })

  it("calls AuthService.loginAsAdmin when portal is 'admin'", async () => {
    const adminUser: User = { ...mockUser, role: "ADMIN" }
    vi.mocked(AuthService.loginAsAdmin).mockResolvedValue({
      ...mockTokensResponse,
      user: adminUser,
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    const dto: LoginDTO = { email: "admin@example.com", password: "secret" }

    await act(async () => {
      await result.current.login(dto, "admin")
    })

    expect(AuthService.loginAsAdmin).toHaveBeenCalledOnce()
    expect(AuthService.loginAsAdmin).toHaveBeenCalledWith(dto)
  })

  it("sets sellerStatus from sellerProfile when user is a SELLER", async () => {
    const sellerUser: User = {
      ...mockUser,
      role: "SELLER",
      sellerProfile: {
        id: "sp-001",
        companyName: "GreenCo",
        status: "APPROVED",
      },
    }
    vi.mocked(AuthService.loginAsSeller).mockResolvedValue({
      ...mockTokensResponse,
      user: sellerUser,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "seller@example.com", password: "pass" }, "seller")
    })

    expect(result.current.sellerStatus).toBe("APPROVED")
  })
})

// ── logout ─────────────────────────────────────────────────────────────────────

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(refreshSession).mockRejectedValue(new Error("no session"))
    vi.mocked(AuthService.loginAsCustomer).mockResolvedValue(mockTokensResponse)
    vi.mocked(AuthService.logout).mockResolvedValue(undefined)
  })

  it("calls AuthService.logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })
    await act(async () => {
      await result.current.logout()
    })

    expect(AuthService.logout).toHaveBeenCalledOnce()
  })

  it("clears user after logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(result.current.user).not.toBeNull()

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })

  it("clears token after logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(result.current.token).not.toBeNull()

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.token).toBeNull()
  })

  it("sets isAuthenticated to false after logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it("resets isLoading to false after logout completes", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("clears sessionStorage after logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    expect(saveAuthSession).toHaveBeenCalled()

    await act(async () => {
      await result.current.logout()
    })

    expect(clearAuthSession).toHaveBeenCalled()
  })

  it("clears user and token even when AuthService.logout throws", async () => {
    vi.mocked(AuthService.logout).mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" }, "customer")
    })

    await act(async () => {
      // logout uses finally, so even on error user/token should be cleared
      try {
        await result.current.logout()
      } catch {
        // expected
      }
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
  })
})

// ── register ───────────────────────────────────────────────────────────────────

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(refreshSession).mockRejectedValue(new Error("no session"))
    vi.mocked(AuthService.register).mockResolvedValue({
      userId: "new-user-001",
      email: "new@example.com",
    })
  })

  it("calls AuthService.register with the provided DTO", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const dto: RegisterDTO = {
      email: "new@example.com",
      password: "password123",
      firstName: "New",
      lastName: "User",
      role: "BUYER",
    }

    await act(async () => {
      await result.current.register(dto)
    })

    expect(AuthService.register).toHaveBeenCalledOnce()
    expect(AuthService.register).toHaveBeenCalledWith(dto)
  })

  it("resets isLoading to false after registration completes", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register({
        email: "new@example.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
        role: "BUYER",
      })
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("does NOT set user or token after registration (email verification required)", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.register({
        email: "new@example.com",
        password: "password123",
        firstName: "New",
        lastName: "User",
        role: "BUYER",
      })
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("resets isLoading to false even when registration throws", async () => {
    vi.mocked(AuthService.register).mockRejectedValue(new Error("Email already in use"))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      try {
        await result.current.register({
          email: "taken@example.com",
          password: "pass",
          firstName: "A",
          lastName: "B",
          role: "BUYER",
        })
      } catch {
        // expected
      }
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("propagates errors thrown by AuthService.register", async () => {
    const registerError = new Error("Email already in use")
    vi.mocked(AuthService.register).mockRejectedValue(registerError)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.register({
          email: "taken@example.com",
          password: "pass",
          firstName: "A",
          lastName: "B",
          role: "BUYER",
        })
      })
    ).rejects.toThrow("Email already in use")
  })
})

// ── session restore on mount (page reload) ────────────────────────────────────
// Two restore paths:
//   A) Cold start (no sessionStorage) — waits for refreshSession() to settle.
//      isLoading stays true until then so the UI shows a spinner, not "Anmelden".
//   B) sessionStorage hit — restores immediately without waiting for the network.
//      A background refresh is still attempted to rotate the token, but failures
//      are silenced; the tab stays logged in for the token's remaining TTL.

describe("session restore on mount — cold start (no sessionStorage)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it("isLoading is true before refreshSession resolves", () => {
    // Never-resolving promise simulates an in-flight request
    vi.mocked(refreshSession).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAuth(), { wrapper })

    // isLoading must be true while refresh is pending
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("restores session when refreshSession succeeds", async () => {
    vi.mocked(refreshSession).mockResolvedValue(mockTokensResponse as never)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe("access-token-abc")
    expect(result.current.isLoading).toBe(false)
  })

  it("stays logged out and sets isLoading=false when refreshSession fails", async () => {
    vi.mocked(refreshSession).mockRejectedValue(new Error("no session"))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})

describe("session restore on mount — sessionStorage hit (page navigation)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Simulate a previously saved session: loadAuthSession() returns the persisted data
    vi.mocked(loadAuthSession).mockReturnValue({
      token: "access-token-abc",
      user: mockUser,
      portal: "customer",
    })
    vi.mocked(refreshSession).mockRejectedValue(new Error("no cookie"))
  })

  it("restores user and token immediately without waiting for the network", () => {
    // refreshSession never resolves — but the session is already restored
    vi.mocked(refreshSession).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe("access-token-abc")
  })

  it("sets isLoading=false immediately when sessionStorage has data", () => {
    vi.mocked(refreshSession).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(false)
  })

  it("does not call refreshSession when sessionStorage has data (Phase 2 short-circuits)", async () => {
    vi.mocked(refreshSession).mockResolvedValue(mockTokensResponse as never)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    // Phase 2 returns early when persisted session exists — refreshSession is NOT called.
    // Token rotation happens via the 10-minute interval, not on mount.
    expect(refreshSession).not.toHaveBeenCalled()
    expect(result.current.token).toBe("access-token-abc")
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("keeps existing session when background refreshSession fails", async () => {
    vi.mocked(refreshSession).mockRejectedValue(new Error("no cookie"))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {})

    // Session from loadAuthSession is preserved
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe("access-token-abc")
    expect(result.current.isLoading).toBe(false)
  })
})

// ── setUser ────────────────────────────────────────────────────────────────────

describe("setUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(refreshSession).mockRejectedValue(new Error("no session"))
  })

  it("replaces the current user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it("updates role when user is replaced", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.setUser({ ...mockUser, role: "ADMIN" })
    })

    expect(result.current.role).toBe("ADMIN")
  })
})

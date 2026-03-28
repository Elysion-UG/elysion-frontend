import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import { AuthProvider, useAuth } from "./AuthContext"
import type { LoginDTO, RegisterDTO, User, TokensResponse } from "@/src/types"

// ── Mock AuthService ───────────────────────────────────────────────────────────

vi.mock("@/src/services/auth.service", () => ({
  AuthService: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
  },
}))

// Import AFTER mock so we get the mocked version
import { AuthService } from "@/src/services/auth.service"

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: "user-001",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  role: "BUYER",
  status: "ACTIVE",
  createdAt: "2024-01-01T00:00:00Z",
}

const mockTokensResponse: TokensResponse = {
  token: "access-token-abc",
  user: mockUser,
  expiresIn: 3600,
}

// ── Wrapper ────────────────────────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

// ── Initial state ──────────────────────────────────────────────────────────────

describe("AuthContext — initial state", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it("starts with isLoading = false", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isLoading).toBe(false)
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
    vi.mocked(AuthService.login).mockResolvedValue(mockTokensResponse)
  })

  it("calls AuthService.login with the provided credentials", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const dto: LoginDTO = { email: "jane@example.com", password: "secret" }

    await act(async () => {
      await result.current.login(dto)
    })

    expect(AuthService.login).toHaveBeenCalledOnce()
    expect(AuthService.login).toHaveBeenCalledWith(dto)
  })

  it("sets user after a successful login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it("sets token after a successful login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })

    expect(result.current.token).toBe("access-token-abc")
  })

  it("sets isAuthenticated to true after login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it("sets role from the returned user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })

    expect(result.current.role).toBe("BUYER")
  })

  it("resets isLoading to false after login completes", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("resets isLoading to false even when login throws", async () => {
    vi.mocked(AuthService.login).mockRejectedValue(new Error("Invalid credentials"))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      try {
        await result.current.login({ email: "bad@example.com", password: "wrong" })
      } catch {
        // expected
      }
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("propagates errors thrown by AuthService.login", async () => {
    const loginError = new Error("Invalid credentials")
    vi.mocked(AuthService.login).mockRejectedValue(loginError)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login({ email: "bad@example.com", password: "wrong" })
      })
    ).rejects.toThrow("Invalid credentials")
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
    vi.mocked(AuthService.login).mockResolvedValue({
      ...mockTokensResponse,
      user: sellerUser,
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "seller@example.com", password: "pass" })
    })

    expect(result.current.sellerStatus).toBe("APPROVED")
  })
})

// ── logout ─────────────────────────────────────────────────────────────────────

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(AuthService.login).mockResolvedValue(mockTokensResponse)
    vi.mocked(AuthService.logout).mockResolvedValue(undefined)
  })

  it("calls AuthService.logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })
    await act(async () => {
      await result.current.logout()
    })

    expect(AuthService.logout).toHaveBeenCalledOnce()
  })

  it("clears user after logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })

    expect(result.current.user).not.toBeNull()

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })

  it("clears token after logout", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
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
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it("resets isLoading to false after logout completes", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
    })
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("clears user and token even when AuthService.logout throws", async () => {
    vi.mocked(AuthService.logout).mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({ email: "jane@example.com", password: "secret" })
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

// ── setUser ────────────────────────────────────────────────────────────────────

describe("setUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

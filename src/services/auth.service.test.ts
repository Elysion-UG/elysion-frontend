import { vi, describe, it, expect, beforeEach } from "vitest"
import { apiRequest } from "@/src/lib/api-client"
import { AuthService } from "./auth.service"
import type { LoginDTO, RegisterDTO, TokensResponse } from "@/src/types"

vi.mock("@/src/lib/api-client", () => ({
  apiRequest: vi.fn(),
}))

const mockApiRequest = vi.mocked(apiRequest)

const mockTokensResponse: TokensResponse = {
  token: "access-token-abc",
  user: {
    id: "u1",
    email: "user@example.com",
    firstName: "Jane",
    lastName: "Doe",
    role: "BUYER",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
  },
  expiresIn: 3600,
}

describe("AuthService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("register — calls POST /api/v1/auth/register with dto body and returns userId + email", async () => {
    const dto: RegisterDTO = {
      email: "new@example.com",
      password: "secret",
      firstName: "Jane",
      lastName: "Doe",
      role: "BUYER",
    }
    mockApiRequest.mockResolvedValue({ userId: "u-new", email: "new@example.com" })

    const result = await AuthService.register(dto)

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
    )
    expect(result).toEqual({ userId: "u-new", email: "new@example.com" })
  })

  it("login — calls POST /api/v1/auth/login with credentials and returns tokens", async () => {
    const dto: LoginDTO = { email: "user@example.com", password: "hunter2" }
    mockApiRequest.mockResolvedValue(mockTokensResponse)

    const result = await AuthService.login(dto)

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({ method: "POST", body: JSON.stringify(dto) })
    )
    expect(result).toEqual(mockTokensResponse)
  })

  it("refresh — calls POST /api/v1/auth/refresh and returns new tokens", async () => {
    mockApiRequest.mockResolvedValue(mockTokensResponse)

    const result = await AuthService.refresh()

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST" })
    )
    expect(result).toEqual(mockTokensResponse)
  })

  it("logout — calls POST /api/v1/auth/logout", async () => {
    mockApiRequest.mockResolvedValue(undefined)

    await AuthService.logout()

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({ method: "POST" })
    )
  })

  it("verifyEmail — calls POST /api/v1/auth/verify-email with token", async () => {
    mockApiRequest.mockResolvedValue(undefined)

    await AuthService.verifyEmail("verify-token-xyz")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/auth/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "verify-token-xyz" }),
      })
    )
  })

  it("forgotPassword — calls POST /api/v1/auth/forgot-password with email", async () => {
    mockApiRequest.mockResolvedValue(undefined)

    await AuthService.forgotPassword("user@example.com")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/auth/forgot-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com" }),
      })
    )
  })

  it("resetPassword — calls POST /api/v1/auth/reset-password with token and newPassword", async () => {
    mockApiRequest.mockResolvedValue(undefined)

    await AuthService.resetPassword("reset-token-abc", "newPassword123!")

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token: "reset-token-abc", newPassword: "newPassword123!" }),
      })
    )
  })
})

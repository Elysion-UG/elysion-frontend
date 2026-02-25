/**
 * AuthService — abstract service layer for authentication.
 * All methods simulate async API calls. Replace the bodies
 * with real fetch/axios calls when the backend is ready.
 */
import type { LoginDTO, LoginResponse, RegisterDTO, User } from "@/src/types"

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms))

export const AuthService = {
  async login(dto: LoginDTO): Promise<LoginResponse> {
    await delay()
    // Simulate: on success, return a mock user + token
    const user: User = {
      id: "usr_1",
      email: dto.email,
      firstName: "Max",
      lastName: "Mustermann",
      phone: "+49 123 456789",
      role: "BUYER",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    }
    return { token: "mock-jwt-token", user }
  },

  async register(dto: RegisterDTO): Promise<void> {
    await delay(800)
    // Simulate successful registration — backend sends verification email
    void dto
  },

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    await delay()
    void token
    return { success: true }
  },

  async forgotPassword(email: string): Promise<void> {
    await delay()
    void email
    // Always resolves — generic response to prevent email enumeration
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await delay()
    void token
    void newPassword
  },

  async refreshToken(currentToken: string): Promise<{ token: string }> {
    await delay(300)
    void currentToken
    return { token: "refreshed-mock-jwt-token" }
  },

  async logout(): Promise<void> {
    await delay(200)
  },
}

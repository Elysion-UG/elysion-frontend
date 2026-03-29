/**
 * AuthService — real API calls to the backend authentication endpoints.
 *
 * Endpoints (base: /api/v1/auth):
 *   POST /register          — register BUYER or SELLER
 *   POST /login             — returns accessToken in JSON + refreshToken as HttpOnly cookie
 *   POST /refresh           — rotates refresh token (cookie), returns new accessToken
 *   POST /logout            — revokes refresh token, clears cookie
 *   POST /verify-email      — verify email with one-time token
 *   POST /forgot-password   — trigger password reset email (always 200 to prevent enumeration)
 *   POST /reset-password    — set new password with reset token
 */
import { apiRequest } from "@/src/lib/api-client"
import type { LoginDTO, RegisterDTO, TokensResponse } from "@/src/types"

export const AuthService = {
  async register(dto: RegisterDTO): Promise<{ userId: string; email: string }> {
    return apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  async login(dto: LoginDTO): Promise<TokensResponse> {
    return apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  /**
   * Uses the HttpOnly refreshToken cookie automatically (credentials: 'include').
   * Returns a new access token and rotates the refresh cookie.
   */
  async refresh(): Promise<TokensResponse> {
    // Pass skipRetry=true — if the refresh endpoint itself returns 401,
    // we must not re-enter tryRefreshAndRetry, which would cause infinite recursion.
    return apiRequest("/api/v1/auth/refresh", { method: "POST", body: "{}" }, true)
  },

  /**
   * Revokes the current refresh token and clears the HttpOnly cookie.
   */
  async logout(): Promise<void> {
    return apiRequest("/api/v1/auth/logout", {
      method: "POST",
      body: "{}",
    })
  },

  async verifyEmail(token: string): Promise<void> {
    return apiRequest("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  },

  /**
   * Always responds 200 to prevent email enumeration.
   */
  async forgotPassword(email: string): Promise<void> {
    return apiRequest("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return apiRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    })
  },
}

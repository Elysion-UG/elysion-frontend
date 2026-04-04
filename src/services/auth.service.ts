/**
 * AuthService — real API calls to the backend authentication endpoints.
 *
 * Endpoints (base: /api/v1/auth):
 *   POST /register              — register BUYER or SELLER
 *   POST /customer/login        — customer portal login
 *   POST /seller/login          — seller portal login
 *   POST /admin/login           — admin portal login
 *   POST /refresh               — rotates refresh token (cookie), returns new accessToken
 *   POST /logout                — revokes refresh token, clears cookie
 *   POST /verify-email          — verify email with one-time token
 *   GET  /verify-email?token=   — link-friendly email verification
 *   POST /resend-verification   — resend verification email
 *   POST /forgot-password       — trigger password reset email (always 200 to prevent enumeration)
 *   POST /reset-password        — set new password with reset token
 *   GET  /reset-password?token= — validate reset token (link-friendly, does not consume token)
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

  /** Login for BUYER users on the customer portal. */
  async loginAsCustomer(dto: LoginDTO): Promise<TokensResponse> {
    return apiRequest("/api/v1/auth/customer/login", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  /** Login for SELLER users on the seller portal. */
  async loginAsSeller(dto: LoginDTO): Promise<TokensResponse> {
    return apiRequest("/api/v1/auth/seller/login", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  /** Login for ADMIN users on the admin portal. */
  async loginAsAdmin(dto: LoginDTO): Promise<TokensResponse> {
    return apiRequest("/api/v1/auth/admin/login", {
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
   * skipRetry=true — a 401 on logout means "no active session to revoke",
   * which is fine. We must not trigger tryRefreshAndRetry here because that
   * would show a spurious "Sitzung abgelaufen" toast and re-redirect to "/".
   */
  async logout(): Promise<void> {
    return apiRequest("/api/v1/auth/logout", { method: "POST", body: "{}" }, true)
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

  /** Always responds 200 to prevent email enumeration. */
  async resendVerification(email: string): Promise<void> {
    return apiRequest("/api/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  /** Validates a password reset token without consuming it. Throws on 4xx. */
  async validateResetToken(token: string): Promise<void> {
    return apiRequest(`/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`, {
      method: "GET",
    })
  },
}

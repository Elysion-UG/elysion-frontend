/**
 * AuthService — backend authentication endpoints (base: /api/v1/auth).
 *
 * Login is portal-specific — there is no generic /login. Endpoint catalogue:
 * docs/api-integration.md.
 *
 * Requests route through the Next.js auth proxy, which round-trips the HttpOnly
 * refresh cookie and mirrors it as the session-presence marker (see
 * app/api/v1/auth/[...path]/route.ts).
 */
import { apiRequest } from "@/src/lib/api-client"
import { parseApiResponse, tokensResponseSchema } from "@/src/lib/api-schemas"
import type { LoginDTO, RegisterDTO, TokensResponse } from "@/src/types"

async function loginRequest(path: string, dto: LoginDTO): Promise<TokensResponse> {
  const raw = await apiRequest<unknown>(path, {
    method: "POST",
    body: JSON.stringify(dto),
  })
  return parseApiResponse(tokensResponseSchema, raw, path)
}

export const AuthService = {
  async register(dto: RegisterDTO): Promise<{ userId: string; email: string }> {
    return apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(dto),
    })
  },

  /** Login for BUYER users on the customer portal. */
  async loginAsCustomer(dto: LoginDTO): Promise<TokensResponse> {
    return loginRequest("/api/v1/auth/customer/login", dto)
  },

  /** Login for SELLER users on the seller portal. */
  async loginAsSeller(dto: LoginDTO): Promise<TokensResponse> {
    return loginRequest("/api/v1/auth/seller/login", dto)
  },

  /** Login for ADMIN users on the admin portal. */
  async loginAsAdmin(dto: LoginDTO): Promise<TokensResponse> {
    return loginRequest("/api/v1/auth/admin/login", dto)
  },

  /**
   * Uses the HttpOnly refreshToken cookie automatically (credentials: 'include').
   * Returns a new access token and rotates the refresh cookie.
   */
  async refresh(): Promise<TokensResponse> {
    // Pass skipRetry=true — if the refresh endpoint itself returns 401,
    // we must not re-enter tryRefreshAndRetry, which would cause infinite recursion.
    const raw = await apiRequest<unknown>(
      "/api/v1/auth/refresh",
      { method: "POST", body: "{}" },
      true
    )
    return parseApiResponse(tokensResponseSchema, raw, "/api/v1/auth/refresh")
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

  /**
   * Validates a password reset token without consuming it. Throws on 4xx.
   * Token travels in the body — never in the URL, so it cannot leak into
   * access logs or error monitoring (issue #66).
   */
  async validateResetToken(token: string): Promise<void> {
    return apiRequest("/api/v1/auth/reset-password/validate", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  },
}

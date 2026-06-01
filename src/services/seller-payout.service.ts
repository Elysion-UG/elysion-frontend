/**
 * SellerPayoutService — Stripe-Connect-Express-Auszahlungskonto des Sellers.
 *
 * Endpoints (SELLER role):
 *   GET  /api/v1/seller/payout-account                  — Konto-Status abrufen
 *   POST /api/v1/seller/payout-account/onboarding-link  — Stripe Account Link erzeugen
 *
 * Der Seller verbindet sein Auszahlungskonto, indem das Frontend ihn zur
 * zurückgelieferten Stripe-URL weiterleitet. Stripe übernimmt KYC und
 * Bankverbindung; nach Abschluss meldet ein Backend-Webhook das Konto als
 * ACTIVE.
 */
import { apiRequest } from "@/src/lib/api-client"
import type { SellerPayoutAccount, PayoutOnboardingLink } from "@/src/types"

export const SellerPayoutService = {
  async getAccount(): Promise<SellerPayoutAccount> {
    return apiRequest("/api/v1/seller/payout-account")
  },

  async createOnboardingLink(): Promise<PayoutOnboardingLink> {
    return apiRequest("/api/v1/seller/payout-account/onboarding-link", {
      method: "POST",
      body: "{}",
    })
  },
}

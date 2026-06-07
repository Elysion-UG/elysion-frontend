// ── Seller Payout Account (Stripe Connect Express) ───────────────────
//
// Auszahlungen laufen über Stripe Connect (Express-Accounts): Stripe
// übernimmt KYC/Compliance und IBAN-Verwaltung, die Plattform behält die
// Provisions-Kontrolle. Der Seller verbindet sein Auszahlungskonto über
// einen von Stripe gehosteten Onboarding-Link.

/**
 * Status des Connect-Express-Kontos eines Sellers.
 * - NOT_CONNECTED: Seller hat noch kein Konto verbunden
 * - PENDING:       Onboarding gestartet, aber noch nicht abgeschlossen
 * - ACTIVE:        Onboarding abgeschlossen, Auszahlungen möglich
 * - RESTRICTED:    Stripe verlangt weitere Angaben / Konto eingeschränkt
 */
export type SellerPayoutAccountStatus = "NOT_CONNECTED" | "PENDING" | "ACTIVE" | "RESTRICTED"

/** Antwort von `GET /api/v1/seller/payout-account` */
export interface SellerPayoutAccount {
  status: SellerPayoutAccountStatus
  /** Stripe: Konto kann Zahlungen empfangen */
  chargesEnabled: boolean
  /** Stripe: Auszahlungen an die Bankverbindung sind freigeschaltet */
  payoutsEnabled: boolean
  /** Stripe: alle erforderlichen Angaben wurden übermittelt */
  detailsSubmitted: boolean
  /** Offene Stripe-Anforderungen (z. B. "individual.verification.document") */
  requirementsDue?: string[]
}

/** Antwort von `POST /api/v1/seller/payout-account/onboarding-link` */
export interface PayoutOnboardingLink {
  /** Stripe Account Link — Frontend leitet den Seller dorthin weiter */
  url: string
}

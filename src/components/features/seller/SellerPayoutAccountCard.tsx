"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Banknote, CheckCircle2, AlertTriangle } from "lucide-react"
import { SellerPayoutService } from "@/src/services/seller-payout.service"
import type { SellerPayoutAccount } from "@/src/types"
import { toast } from "sonner"
import { payoutAccountStatusLabel, payoutAccountStatusColor } from "./sellerDashboard.constants"

/**
 * Karte zum Verbinden des Stripe-Connect-Express-Auszahlungskontos.
 * Zeigt den aktuellen Konto-Status und leitet den Seller für Onboarding
 * bzw. zum Vervollständigen offener Angaben zu Stripe weiter.
 */
export default function SellerPayoutAccountCard() {
  const [account, setAccount] = useState<SellerPayoutAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  const fetchAccount = useCallback(async () => {
    setLoading(true)
    try {
      const data = await SellerPayoutService.getAccount()
      setAccount(data)
    } catch {
      toast.error("Auszahlungskonto konnte nicht geladen werden.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccount()
  }, [fetchAccount])

  const handleConnect = async () => {
    setRedirecting(true)
    try {
      const { url } = await SellerPayoutService.createOnboardingLink()
      window.location.href = url
    } catch {
      toast.error("Verbindung zu Stripe konnte nicht hergestellt werden.")
      setRedirecting(false)
    }
  }

  const status = account?.status ?? "NOT_CONNECTED"
  const isActive = status === "ACTIVE"
  const needsAction = status === "NOT_CONNECTED" || status === "PENDING" || status === "RESTRICTED"

  const ctaLabel =
    status === "NOT_CONNECTED"
      ? "Auszahlungskonto verbinden"
      : status === "ACTIVE"
        ? "Stripe-Konto verwalten"
        : "Einrichtung abschließen"

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 p-6">
        <Banknote className="h-5 w-5 text-teal-600" />
        <h2 className="text-xl font-semibold text-slate-800">Auszahlungskonto</h2>
        {!loading && account && (
          <span
            className={`ml-auto inline-block rounded-full px-3 py-1 text-xs font-medium ${payoutAccountStatusColor[status]}`}
          >
            {payoutAccountStatusLabel[status]}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="space-y-4 p-6">
          {isActive ? (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                Ihr Auszahlungskonto ist aktiv. Auszahlungen werden monatlich über Stripe
                abgewickelt.
              </p>
            </div>
          ) : status === "RESTRICTED" ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-800">
                Stripe benötigt weitere Angaben, bevor Auszahlungen erfolgen können. Bitte
                vervollständigen Sie die Einrichtung.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Verbinden Sie Ihr Bankkonto über Stripe, um Auszahlungen zu erhalten. Die Überprüfung
              Ihrer Daten (KYC) übernimmt Stripe.
            </p>
          )}

          {account?.requirementsDue && account.requirementsDue.length > 0 && (
            <p className="text-xs text-slate-500">
              Offene Anforderungen: {account.requirementsDue.join(", ")}
            </p>
          )}

          {(needsAction || isActive) && (
            <button
              onClick={handleConnect}
              disabled={redirecting}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {redirecting && <Loader2 className="h-4 w-4 animate-spin" />}
              {ctaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

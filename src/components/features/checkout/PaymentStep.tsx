"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Loader2, CreditCard, AlertCircle, RefreshCw } from "lucide-react"
import { PaymentService } from "@/src/services/payment.service"
import { formatEuro } from "@/src/lib/currency"
import type { PaymentStatusResponse } from "@/src/types"

// ── Stripe singleton (module-level per Stripe best practices) ────────
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

// ── Props ────────────────────────────────────────────────────────────
interface PaymentStepProps {
  orderId: string
  totalAmount: number
  onSuccess: () => void
  onError: (msg: string) => void
}

// ── Status polling helper ────────────────────────────────────────────
const POLL_MAX_ATTEMPTS = 3
const POLL_INTERVAL_MS = 2000

async function pollPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  let lastStatus: PaymentStatusResponse | null = null
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    lastStatus = await PaymentService.getStatus(paymentId)
    if (
      lastStatus.status === "SUCCEEDED" ||
      lastStatus.status === "FAILED" ||
      lastStatus.status === "CANCELLED"
    ) {
      return lastStatus
    }
    if (attempt < POLL_MAX_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }
  }
  return lastStatus!
}

// ── Inner form (must be inside <Elements>) ───────────────────────────
interface PaymentFormProps {
  paymentId: string
  totalAmount: number
  onSuccess: () => void
  onError: (msg: string) => void
}

function PaymentForm({ paymentId, totalAmount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!stripe || !elements) return

      setSubmitting(true)
      setErrorMessage(null)

      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: window.location.href },
          redirect: "if_required",
        })

        if (error) {
          setErrorMessage(error.message ?? "Zahlung fehlgeschlagen.")
          setSubmitting(false)
          return
        }

        // Payment confirmed on Stripe side -- verify via backend
        setPolling(true)
        const status = await pollPaymentStatus(paymentId)

        if (status.status === "SUCCEEDED") {
          onSuccess()
        } else if (status.status === "FAILED" || status.status === "CANCELLED") {
          setErrorMessage(
            "Die Zahlung wurde nicht erfolgreich abgeschlossen. Bitte versuche es erneut."
          )
          setPolling(false)
          setSubmitting(false)
        } else {
          // Still pending after polling -- treat as success (webhook will finalize)
          onSuccess()
        }
      } catch {
        setErrorMessage("Ein unerwarteter Fehler ist aufgetreten.")
        onError("Zahlungsverarbeitung fehlgeschlagen.")
        setSubmitting(false)
        setPolling(false)
      }
    },
    [stripe, elements, paymentId, onSuccess, onError]
  )

  const handleRetry = useCallback(() => {
    setErrorMessage(null)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-700">
          <CreditCard className="h-5 w-5 text-teal-600" />
          Zahlungsinformationen
        </h2>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600 underline underline-offset-2 hover:text-red-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Erneut versuchen
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between font-bold text-slate-800">
          <span>Zu zahlen</span>
          <span>{formatEuro(totalAmount)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {polling ? "Zahlung wird bestätigt..." : "Wird verarbeitet..."}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Jetzt bezahlen
          </>
        )}
      </button>
    </form>
  )
}

// ── Main PaymentStep component ───────────────────────────────────────
export default function PaymentStep({
  orderId,
  totalAmount,
  onSuccess,
  onError,
}: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    let cancelled = false

    async function createIntent() {
      try {
        const intent = await PaymentService.createIntent({
          orderId,
          amount: totalAmount,
        })
        if (!cancelled) {
          setClientSecret(intent.clientSecret)
          setPaymentId(intent.id)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setInitError(
            "Zahlungsvorgang konnte nicht gestartet werden. Bitte versuche es später erneut."
          )
          setLoading(false)
          onErrorRef.current("PaymentIntent konnte nicht erstellt werden.")
        }
      }
    }

    createIntent()
    return () => {
      cancelled = true
    }
  }, [orderId, totalAmount])

  // Stripe not configured
  if (!stripePromise) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-bold text-slate-800">Zahlungssystem nicht konfiguriert</h2>
        <p className="text-sm text-slate-500">
          Der Stripe-Publishable-Key ist nicht hinterlegt. Bitte kontaktiere den Support.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Zahlungsvorgang wird vorbereitet...</p>
      </div>
    )
  }

  if (initError || !clientSecret || !paymentId) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h2 className="mb-2 text-xl font-bold text-slate-800">Fehler</h2>
        <p className="text-sm text-slate-500">{initError ?? "Unbekannter Fehler."}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-slate-800">
        <CreditCard className="h-8 w-8 text-teal-600" />
        Zahlung
      </h1>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#0d9488",
              borderRadius: "8px",
            },
          },
          locale: "de",
        }}
      >
        <PaymentForm
          paymentId={paymentId}
          totalAmount={totalAmount}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  )
}

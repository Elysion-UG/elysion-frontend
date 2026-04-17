"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { AddressService } from "@/src/services/address.service"
import { CheckoutService } from "@/src/services/checkout.service"
import { useCart } from "@/src/context/CartContext"
import { useAuth } from "@/src/context/AuthContext"
import type { Address, CheckoutStartResponse, CheckoutCompleteResponse } from "@/src/types"
import { toast } from "sonner"
import PaymentStep from "@/src/components/features/checkout/PaymentStep"
import { AddressStep } from "./steps/AddressStep"
import { PreviewStep } from "./steps/PreviewStep"
import { SuccessStep } from "./steps/SuccessStep"
import { LoginRequired } from "./steps/LoginRequired"

type Step = "address" | "preview" | "payment" | "success"

export default function Checkout() {
  const { refetch } = useCart()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState<Step>("address")
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [preview, setPreview] = useState<CheckoutStartResponse | null>(null)
  const [result, setResult] = useState<CheckoutCompleteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    AddressService.getAll()
      .then((list) => {
        setAddresses(list)
        const def = list.find((a) => a.isDefault) ?? list[0]
        if (def) setSelectedAddressId(def.id)
      })
      .catch(() => toast.error("Adressen konnten nicht geladen werden."))
  }, [isAuthenticated])

  const handlePreview = useCallback(async () => {
    if (!selectedAddressId) {
      toast.error("Bitte wähle eine Lieferadresse.")
      return
    }
    setIsLoading(true)
    try {
      const data = await CheckoutService.preview({
        shippingAddressId: selectedAddressId,
        paymentMethod: "MOCK",
      })
      setPreview(data)
      setStep("preview")
    } catch {
      toast.error("Bestellung konnte nicht vorgeprüft werden.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedAddressId])

  const handleComplete = useCallback(async () => {
    if (!selectedAddressId) return
    setIsLoading(true)
    try {
      const data = await CheckoutService.complete({
        shippingAddressId: selectedAddressId,
        paymentMethod: "STRIPE",
      })
      setResult(data)
      setStep("payment")
    } catch {
      toast.error("Bestellung konnte nicht abgeschlossen werden.")
    } finally {
      setIsLoading(false)
    }
  }, [selectedAddressId])

  const handlePaymentSuccess = useCallback(async () => {
    await refetch()
    toast.success("Zahlung erfolgreich! Bestellung aufgegeben.")
    setStep("success")
  }, [refetch])

  const handlePaymentError = useCallback((msg: string) => {
    toast.error(msg)
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginRequired />
  }

  if (step === "payment" && result) {
    return (
      <PaymentStep
        orderId={result.orderId ?? ""}
        totalAmount={result.checkout?.subtotal ?? preview?.subtotal ?? 0}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    )
  }

  if (step === "success" && result) {
    return <SuccessStep orderNumber={result.orderNumber} />
  }

  if (step === "preview" && preview) {
    return (
      <PreviewStep
        preview={preview}
        onBack={() => setStep("address")}
        onComplete={handleComplete}
        isLoading={isLoading}
      />
    )
  }

  return (
    <AddressStep
      addresses={addresses}
      selectedAddressId={selectedAddressId}
      onSelect={setSelectedAddressId}
      onContinue={handlePreview}
      isLoading={isLoading}
    />
  )
}
